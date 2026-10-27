/* 安規工具 — 跨裝置同步（私密 Gist）
   移植自行動祕書（Mobile-secretary）的同步機制，邏輯刻意保持一致，差異只有三處：

   1. 自己的 Gist、自己的密語 —— 公司資料不跟個人行程混在同一份加密檔裡。
   2. **一定要加密才會上傳。** 行動祕書的加密是選用的；這裡是強制的，因為牌價與
      報價履歷是公司資產，而 secret Gist 不是私密的（知道網址就讀得到）。
      沒有金鑰 → sync.err='needpass'，絕不上傳。
   3. localStorage 的鍵一律 `sq.` 開頭。GitHub Pages 的 fyj5867.github.io 是單一
      origin，HC、行動祕書、安規工具共用同一份 localStorage，不加前綴會撞名。

   ── 寫入紀律（跟行動祕書同一條，違反就會被舊資料蓋回去）──
   任何寫入都要經過 Store.set / Store.del，它們會補 updatedAt 與墓碑。
   直接改陣列再存檔 = 那筆沒有新的 updatedAt = 下次同步被雲端的舊版蓋掉。
*/
(() => {
'use strict';

/* ══════ 基本工具 ══════ */
const iso = () => new Date().toISOString();
const pad = n => String(n).padStart(2, '0');
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

/* ══════ 加密（WebCrypto）══════
   PBKDF2-SHA256 由同步密語推出金鑰、AES-GCM 加解密。
   只存推導出的金鑰，不存密語原文。 */
const b64e = buf => {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let t = '';
  for (let i = 0; i < u.length; i += 0x8000) t += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(t);
};
const b64d = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
const randB64 = n => b64e(crypto.getRandomValues(new Uint8Array(n)));
async function pbkdf2(pass, saltB64, iter) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  return b64e(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: b64d(saltB64), iterations: iter, hash: 'SHA-256' }, base, 256));
}
const aesKey = raw => crypto.subtle.importKey('raw', b64d(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
async function sealText(text, raw) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(raw), new TextEncoder().encode(text));
  return { iv: b64e(iv), ct: b64e(ct) };
}
async function openText(iv, ct, raw) {
  return new TextDecoder().decode(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(iv) }, await aesKey(raw), b64d(ct)));
}

/* ══════ 設定 ══════ */
const GIST_DESC = '安規工具 Safety Tools 同步資料（請勿刪除）';
const DATA_FILE = 'safety-data.json';
const CFG_KEY   = 'sq.sync.v1';          /* token / gistId / 金鑰，只在這台裝置 */
const SYNC_ITER = 250000;
const TOMB_DAYS = 120;
const PAIR_TAG  = 'SQ1.';
const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description='
                + encodeURIComponent('安規工具同步');

let cfg = (() => {
  try { const c = JSON.parse(LS.get(CFG_KEY)); return c && c.token && c.gistId ? c : null; }
  catch (e) { return null; }
})();
const saveCfg = () => cfg ? LS.set(CFG_KEY, JSON.stringify(cfg)) : LS.del(CFG_KEY);

const state = { busy: false, again: false, err: null, kdf: null, timer: null, lastErrShown: null };

/* 由各工具註冊：要同步哪些集合、怎麼拿本機資料、怎麼寫回去 */
let COLS = [], readLocal = () => ({}), writeLocal = () => {}, onChange = () => {};

/* ══════ GitHub API ══════ */
async function gh(method, path, body, token) {
  const res = await fetch('https://api.github.com' + path, {
    method, cache: 'no-store',
    headers: Object.assign(
      { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + (token || (cfg && cfg.token)) },
      body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) { const e = new Error('GitHub ' + res.status); e.status = res.status; throw e; }
  return res.status === 204 ? null : res.json();
}
const syncErr = (code, kdf) => { const e = new Error(code); e.code = code; e.kdf = kdf; return e; };

/* ══════ 讀雲端 ══════ */
async function readRemote(g, c = cfg) {
  const f = g && g.files && g.files[DATA_FILE];
  if (!f) return null;
  let txt = f.content;
  /* Gist 太大時 content 會被截斷，要改抓 raw_url */
  if (f.truncated && f.raw_url) txt = await fetch(f.raw_url, { cache: 'no-store' }).then(r => r.text());
  let d; try { d = JSON.parse(txt); } catch (e) { return null; }
  if (d && d.enc) {
    const kdf = d.kdf || {};
    const keys = [c && c.ek ? { salt: c.esalt, ek: c.ek } : null]
      .concat((c && c.prevKeys) || []).filter(Boolean);
    const k = keys.find(x => x.salt === kdf.salt);
    if (!k) throw syncErr('needpass', kdf);
    try { d = JSON.parse(await openText(d.iv, d.ct, k.ek)); }
    catch (e) { throw syncErr('badpass', kdf); }
  } else if (d && !d.enc) {
    /* 雲端是明文：代表被舊版或別的東西寫過。不接受，重新上傳加密版。 */
    d._wasPlain = true;
  }
  const out = { deleted: (d && d.deleted && typeof d.deleted === 'object') ? d.deleted : {}, _wasPlain: !!(d && d._wasPlain) };
  COLS.forEach(col => { out[col] = Array.isArray(d && d[col]) ? d[col].filter(x => x && x.id) : []; });
  return out;
}

/* ══════ 合併：逐筆比 updatedAt，新的贏；墓碑比資料新就刪 ══════ */
function mergeData(L, R) {
  if (!R) return L;
  const del = Object.assign({}, R.deleted || {});
  Object.keys(L.deleted || {}).forEach(k => { if (!del[k] || L.deleted[k] > del[k]) del[k] = L.deleted[k]; });
  const cutoff = new Date(Date.now() - TOMB_DAYS * 864e5).toISOString();
  Object.keys(del).forEach(k => { if (del[k] < cutoff) delete del[k]; });   /* 過期墓碑清掉 */
  const out = { deleted: del };
  COLS.forEach(col => {
    const m = new Map();
    (R[col] || []).forEach(d => m.set(d.id, d));
    (L[col] || []).forEach(d => {
      const r = m.get(d.id);
      if (!r || (d.updatedAt || '') >= (r.updatedAt || '')) m.set(d.id, d);
    });
    out[col] = Array.from(m.values())
      .filter(d => { const t = del[col + ':' + d.id]; return !t || (d.updatedAt || '') > t; });
  });
  return out;
}

/* 穩定序列化：用來判斷「有沒有真的變」，避免沒變也上傳 */
function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object')
    return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort()
      .map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const byId = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const canon = d => stable(Object.assign(
  { deleted: d.deleted || {} },
  ...COLS.map(col => ({ [col]: (d[col] || []).slice().sort(byId) }))));

/* ══════ 上傳用的內容 —— 沒有金鑰就不給，絕不明文上傳 ══════ */
async function payloadData(snap) {
  const txt = JSON.stringify(Object.assign({ app: 'safety-tools', v: 1, syncedAt: iso() }, snap));
  if (!cfg || !cfg.ek) throw syncErr('needpass', cfg && cfg.esalt ? { salt: cfg.esalt, iter: SYNC_ITER } : null);
  const box = await sealText(txt, cfg.ek);
  return JSON.stringify({
    app: 'safety-tools', v: 1, enc: 1,
    kdf: { alg: 'PBKDF2-SHA256', iter: cfg.eiter || SYNC_ITER, salt: cfg.esalt },
    iv: box.iv, ct: box.ct
  });
}

/* ══════ 同步主流程 ══════ */
function schedule(delay = 1500) {
  if (!cfg) return;
  clearTimeout(state.timer);
  state.timer = setTimeout(() => now(false), delay);
}

async function now(manual) {
  if (!cfg) return;
  if (!navigator.onLine) { state.err = 'net'; onChange(); return; }
  if (state.busy) { state.again = true; return; }
  state.busy = true; onChange();
  try {
    const g = await gh('GET', '/gists/' + cfg.gistId);
    const remote = await readRemote(g);
    const local = readLocal();
    const merged = mergeData(local, remote);
    const mStr = canon(merged);
    const changed = mStr !== canon(local);
    if (changed) { writeLocal(merged); }
    /* 要不要寫回雲端：內容不同，或雲端還是明文（必須換成加密版） */
    const needUp = !remote || mStr !== canon(remote) || remote._wasPlain;
    if (needUp) {
      await gh('PATCH', '/gists/' + cfg.gistId, { files: { [DATA_FILE]: { content: await payloadData(merged) } } });
      delete cfg.prevKeys;
    }
    cfg.lastSync = iso(); saveCfg();
    state.err = null; state.lastErrShown = null;
    onChange(changed);
    if (manual) API.toast('同步完成，所有裝置都是最新資料', 'ok');
  } catch (e) {
    if (e.code === 'needpass' || e.code === 'badpass') { state.err = 'needpass'; state.kdf = e.kdf; }
    else state.err = (e.status === 401 || e.status === 403) ? 'auth' : e.status === 404 ? 'missing' : 'net';
    const msg = {
      auth:     '同步失敗：GitHub 金鑰無效或已過期，請重新連線',
      missing:  '同步失敗：找不到雲端資料（Gist 可能被刪除），請重新連線',
      net:      '暫時連不上 GitHub，稍後會自動再試',
      needpass: '雲端資料有加密：請輸入同步密語'
    }[state.err];
    if (manual || state.lastErrShown !== state.err) { API.toast(msg, 'err'); state.lastErrShown = state.err; }
    onChange();
  } finally {
    state.busy = false; onChange();
    if (state.again) { state.again = false; schedule(400); }
  }
}

/* ══════ 配對碼 ══════ */
const b64u   = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => decodeURIComponent(escape(atob(String(s).replace(/-/g, '+').replace(/_/g, '/'))));
const pairCode = () => cfg ? PAIR_TAG + b64u(JSON.stringify({
  t: cfg.token, g: cfg.gistId,
  e: cfg.ek ? { k: cfg.ek, s: cfg.esalt, i: cfg.eiter || SYNC_ITER } : undefined
})) : '';
function readPairCode(code) {
  try {
    const o = JSON.parse(unb64u(String(code).trim().replace(new RegExp('^' + PAIR_TAG.replace('.', '\\.')), '')));
    if (!o || !o.t || !o.g) return null;
    return { token: o.t, gistId: o.g,
             enc: (o.e && o.e.k && o.e.s) ? { ek: o.e.k, esalt: o.e.s, eiter: o.e.i || SYNC_ITER } : null };
  } catch (e) { return null; }
}

/* ══════ 連線 ══════ */
async function connect(raw, pass) {
  const s = String(raw || '').trim();
  let token = s, gistId = null, encIn = null;
  if (s.startsWith(PAIR_TAG)) {
    const p = readPairCode(s);
    if (!p) throw new Error('配對碼不完整，請重新複製一次');
    token = p.token; gistId = p.gistId; encIn = p.enc;
  }
  if (!/^(ghp_|github_pat_)[A-Za-z0-9_]{20,}$/.test(token))
    throw new Error('這看起來不是 GitHub 金鑰：金鑰是 ghp_ 開頭的一長串，配對碼是 ' + PAIR_TAG + ' 開頭');

  const user = await gh('GET', '/user', null, token);

  if (!gistId) {
    const list = await gh('GET', '/gists?per_page=100', null, token);
    const found = (list || []).find(x => x.description === GIST_DESC);
    if (found) gistId = found.id;
  }

  /* 金鑰：配對碼帶過來的優先，否則用密語推導 */
  let enc = encIn;
  if (!enc) {
    if (!pass) throw syncErr('needpass', null);
    const salt = (cfg && cfg.esalt) || randB64(16);
    enc = { ek: await pbkdf2(pass, salt, SYNC_ITER), esalt: salt, eiter: SYNC_ITER };
  }

  const next = Object.assign({ token, gistId, login: user.login, since: iso() }, enc);

  if (gistId) {
    /* 既有 Gist：先確認這把金鑰解得開，解不開就不要覆寫人家的資料 */
    const remote = await readRemote(await gh('GET', '/gists/' + gistId, null, token), next);
    if (remote) { cfg = next; saveCfg(); writeLocal(mergeData(readLocal(), remote)); }
    else { cfg = next; saveCfg(); }
  } else {
    cfg = next; saveCfg();
    const created = await gh('POST', '/gists', {
      description: GIST_DESC, public: false,
      files: { [DATA_FILE]: { content: await payloadData(readLocal()) } }
    }, token);
    cfg.gistId = created.id; saveCfg();
  }
  state.err = null; state.kdf = null;
  onChange(true);
  await now(false);
  return { login: user.login, created: !gistId };
}

/* 已連線但雲端是別的密語加密的 —— 補輸入 */
async function setPassphrase(pass) {
  if (!cfg) throw new Error('尚未連線');
  const salt = (state.kdf && state.kdf.salt) || cfg.esalt || randB64(16);
  const iter = (state.kdf && state.kdf.iter) || SYNC_ITER;
  const ek = await pbkdf2(pass, salt, iter);
  /* 舊金鑰留著，讀得到舊檔；寫回新檔後 syncNow 會清掉 */
  const prev = (cfg.prevKeys || []).concat(cfg.ek ? [{ salt: cfg.esalt, ek: cfg.ek }] : []);
  cfg = Object.assign({}, cfg, { ek, esalt: salt, eiter: iter, prevKeys: prev });
  saveCfg(); state.err = null;
  await now(true);
}

function disconnect() {
  cfg = null; saveCfg(); state.err = null; state.kdf = null;
  clearTimeout(state.timer);
  onChange();
}

/* ══════ 狀態 ══════ */
function status() {
  if (!cfg)                    return { cls: 'off',  txt: '尚未開啟' };
  if (state.busy)              return { cls: 'busy', txt: '同步中…' };
  if (state.err === 'auth')    return { cls: 'err',  txt: '金鑰失效' };
  if (state.err === 'missing') return { cls: 'err',  txt: '找不到雲端資料' };
  if (state.err === 'net')     return { cls: 'busy', txt: '離線，稍後再試' };
  if (state.err === 'needpass')return { cls: 'err',  txt: '需要同步密語' };
  const t = cfg.lastSync ? new Date(cfg.lastSync) : null;
  return { cls: 'ok', txt: t ? `已同步 ${pad(t.getHours())}:${pad(t.getMinutes())}` : '已連線' };
}

/* ══════ 寫入紀律：一定要走這裡 ══════ */
const Store = {
  /* 新增或修改一筆：自動補 updatedAt */
  set(snap, col, doc) {
    const arr = snap[col] || (snap[col] = []);
    const d = Object.assign({}, doc, { updatedAt: iso() });
    const i = arr.findIndex(x => x.id === d.id);
    if (i < 0) arr.push(d); else arr[i] = d;
    if (snap.deleted) delete snap.deleted[col + ':' + d.id];   /* 復活就撤墓碑 */
    return d;
  },
  /* 刪除一筆：留墓碑，否則別台的舊資料會把它復活 */
  del(snap, col, id) {
    snap[col] = (snap[col] || []).filter(x => x.id !== id);
    (snap.deleted || (snap.deleted = {}))[col + ':' + id] = iso();
  }
};

/* ══════ 對外 ══════ */
const API = {
  GIST_DESC, DATA_FILE, TOKEN_URL, PAIR_TAG, Store,
  /* 純函式，開放給各工具重用，也讓合併邏輯可被測試 */
  mergeData, canon,
  setCols(c) { COLS = c || []; },
  init(opts) {
    COLS = opts.cols || [];
    readLocal  = opts.readLocal;
    writeLocal = opts.writeLocal;
    onChange   = opts.onChange || (() => {});
    if (opts.toast) API.toast = opts.toast;
    /* 同步時機：開 App、切回 App、每 60 秒、恢復連線 —— 與行動祕書一致 */
    if (cfg) now(false);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(300); });
    addEventListener('online',  () => schedule(300));
    addEventListener('focus',   () => schedule(800));
    setInterval(() => { if (cfg && !document.hidden) now(false); }, 60000);
    /* 網址帶 #pair=… 時交給頁面處理 */
    const m = location.hash.match(/#pair=([^&]+)/);
    if (m && opts.onPair) { try { opts.onPair(decodeURIComponent(m[1])); } catch (e) {} }
    onChange();
  },
  connected: () => !!cfg,
  info: () => cfg ? { login: cfg.login, gistId: cfg.gistId, lastSync: cfg.lastSync, encrypted: !!cfg.ek } : null,
  needsPassphrase: () => state.err === 'needpass',
  connect, disconnect, setPassphrase, now, schedule, status, pairCode, readPairCode,
  toast(msg) { if (msg) console.log('[sync]', msg); }      /* 頁面可用 init({toast}) 蓋掉 */
};
window.SQSync = API;
})();
