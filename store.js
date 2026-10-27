/* ══════════════════════════════════════════════════════════════
   安規工具 — 三支工具共用的本機資料層
   ══════════════════════════════════════════════════════════════
   為什麼要有這一層：
   三支工具原本各存各的 localStorage 鍵，sync.js 只能同步它拿得到的那一份。
   把所有集合收進同一份快照（sq.data.v1），sync.js 同步這一份，三支工具就
   自動一起跨裝置了，不必各自接一套同步。

   集合：
     quotes  報價存檔      每筆一個文件，id 沿用原本的存檔 id
     preps   準備頁存檔    每筆一個文件，id 用存檔名稱
     certs   效期看板資料  每張證書一個文件
     config  參考資料      rates（牌價）／prepdata（準備頁基礎資料）各一個文件

   為什麼 config 用整包覆蓋、其他用逐筆合併：
   牌價是參考資料，兩台同時改的機率極低，而且真的撞到時「新的贏」是對的。
   存檔不一樣 —— 兩台各自新增不同的存檔是常見情境，整包覆蓋會silently吃掉
   另一台那筆，所以必須逐筆合併。

   ★ 公司資料（牌價、報價履歷）一律不進原始碼、不進版控。這一層只放在使用者
     自己的裝置上，要跨裝置是經過 sync.js 的 AES-GCM 加密後才上傳。
   ══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var KEY  = 'sq.data.v1';
  var COLS = ['quotes', 'preps', 'certs', 'config'];

  /* 舊鍵 → 新集合。搬過一次就記起來，不重複搬。 */
  var MIGRATED = 'sq.migrated.v1';

  var OK = (function () {
    try { localStorage.setItem('__sqprobe', '1'); localStorage.removeItem('__sqprobe'); return true; }
    catch (e) { return false; }
  })();

  var iso = function () { return new Date().toISOString(); };

  function read() {
    var d = null;
    if (OK) { try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {} }
    if (!d || typeof d !== 'object') d = {};
    if (!d.deleted) d.deleted = {};
    COLS.forEach(function (c) { if (!Array.isArray(d[c])) d[c] = []; });
    return d;
  }

  function write(d) {
    if (!OK) return false;
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; }
    catch (e) { return false; }     /* 配額滿了：呼叫端自己決定要不要提示 */
  }

  /* ── 讀 ── */
  function all(col) { return read()[col] || []; }

  function get(col, id) {
    var rows = all(col);
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }

  /* ── 寫 ──
     一律補 updatedAt，並清掉同 id 的墓碑（否則下次合併會被當成已刪除而復活失敗）。 */
  function put(col, doc) {
    if (!doc || !doc.id) return false;
    var d = read();
    doc = Object.assign({}, doc, { updatedAt: iso() });
    d[col] = (d[col] || []).filter(function (x) { return x.id !== doc.id; });
    d[col].push(doc);
    delete d.deleted[col + ':' + doc.id];
    var ok = write(d);
    if (ok) schedule();
    return ok;
  }

  /* 整個集合換掉，但逐筆比對：內容沒變的不動 updatedAt，
     免得每次繪製都把整包標成「剛改過」而觸發不必要的上傳。 */
  function putAll(col, docs) {
    var d = read();
    var old = {};
    (d[col] || []).forEach(function (x) { old[x.id] = x; });
    var now = iso(), keep = [], seen = {};
    (docs || []).forEach(function (doc) {
      if (!doc || !doc.id) return;
      seen[doc.id] = 1;
      var prev = old[doc.id];
      var a = JSON.stringify(Object.assign({}, doc, { updatedAt: 0 }));
      var b = prev ? JSON.stringify(Object.assign({}, prev, { updatedAt: 0 })) : null;
      keep.push(a === b ? prev : Object.assign({}, doc, { updatedAt: now }));
      delete d.deleted[col + ':' + doc.id];
    });
    /* 這次沒出現的，視為刪除 —— 留墓碑，不然同步回來會復活 */
    Object.keys(old).forEach(function (id) {
      if (!seen[id]) d.deleted[col + ':' + id] = now;
    });
    d[col] = keep;
    var ok = write(d);
    if (ok) schedule();
    return ok;
  }

  function del(col, id) {
    var d = read();
    d[col] = (d[col] || []).filter(function (x) { return x.id !== id; });
    d.deleted[col + ':' + id] = iso();
    var ok = write(d);
    if (ok) schedule();
    return ok;
  }

  /* ── config：整包存取 ── */
  function getConfig(name) {
    var doc = get('config', name);
    return doc ? doc.data : null;
  }
  function setConfig(name, data) { return put('config', { id: name, data: data }); }

  /* ── 同步 ── */
  function schedule() {
    if (global.SQSync && typeof global.SQSync.schedule === 'function') global.SQSync.schedule(1200);
  }

  /* 把這一頁接上 sync.js。三支工具呼叫的參數一樣，差別只在 onChange 要重畫什麼。 */
  function attach(onChange, toast) {
    if (!global.SQSync || typeof global.SQSync.init !== 'function') return false;
    global.SQSync.init({
      cols: COLS,
      readLocal: read,
      writeLocal: function (d) { write(d); },
      onChange: onChange || function () {},
      toast: toast || function () {}
    });
    return true;
  }

  /* ── 一次性搬家：舊鍵的資料搬進共用快照 ──
     搬完不刪舊鍵。萬一這一層有問題，舊資料還在原地，使用者不會兩頭落空。 */
  function migrate(jobs) {
    if (!OK) return [];
    var done = {};
    try { done = JSON.parse(localStorage.getItem(MIGRATED) || '{}'); } catch (e) {}
    var moved = [];
    jobs.forEach(function (j) {
      if (done[j.from]) return;
      var raw = localStorage.getItem(j.from);
      if (raw == null) { done[j.from] = 'empty'; return; }
      var v; try { v = JSON.parse(raw); } catch (e) { done[j.from] = 'bad-json'; return; }
      var docs = j.toDocs(v);
      if (docs && docs.length) {
        /* 不覆蓋已經在共用快照裡的同 id 文件 —— 同步可能已經帶回更新的版本 */
        var have = {};
        all(j.col).forEach(function (x) { have[x.id] = 1; });
        var add = docs.filter(function (x) { return x && x.id && !have[x.id]; });
        if (add.length) {
          var d = read();
          add.forEach(function (x) { d[j.col].push(Object.assign({ updatedAt: iso() }, x)); });
          write(d);
          moved.push(j.col + ' +' + add.length);
        }
      }
      done[j.from] = iso();
    });
    try { localStorage.setItem(MIGRATED, JSON.stringify(done)); } catch (e) {}
    return moved;
  }

  global.SQStore = {
    KEY: KEY, COLS: COLS, available: OK,
    read: read, write: write,
    all: all, get: get, put: put, putAll: putAll, del: del,
    getConfig: getConfig, setConfig: setConfig,
    attach: attach, migrate: migrate, schedule: schedule
  };
})(window);
