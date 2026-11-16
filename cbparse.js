/* 從 CB 報告／UL CCL 的零件表（4.1.2 Critical components）推導機台組態。
   輸入：pages = [{items:[{x,y,s}]}]（pdf.js 的文字位置，y 向上為大）。
   本檔不含任何金額或公司資料。 */
(function (root) {
  "use strict";

  /* ── 1. 找出零件表所在頁，切成列、欄 ── */
  const HDR = [
    ["obj",  /^object/i], ["mfr",  /^manufacturer/i], ["type", /^type/i],
    ["tech", /^technical/i], ["std",  /^(standard|product)/i], ["mark", /^mark/i]
  ];

  function lineOf(items) {                    /* 同一 y 的字合併成一行（含起點 x） */
    const m = new Map();
    items.forEach(i => { const k = Math.round(i.y); (m.get(k) || m.set(k, []).get(k)).push(i); });
    return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([y, a]) => {
      a.sort((p, q) => p.x - q.x); return {y, x: a[0].x, text: a.map(t => t.s).join(" ").replace(/\s+/g, " ").trim(), items: a};
    });
  }

  function findBounds(lines) {                /* 表頭那一行 → 各欄起點 x */
    for (const ln of lines) {
      if (!/object\s*\/?\s*part/i.test(ln.text)) continue;
      const bounds = {};
      ln.items.forEach(it => HDR.forEach(([k, re]) => { if (bounds[k] === undefined && re.test(it.s.trim())) bounds[k] = it.x; }));
      /* 表頭常拆成多個字，type / standard 可能抓不到 → 至少要有 obj 與 mark */
      if (bounds.obj !== undefined && bounds.mark !== undefined) return bounds;
    }
    return null;
  }

  function colOf(x, B) {
    const ks = HDR.map(h => h[0]).filter(k => B[k] !== undefined).sort((a, b) => B[a] - B[b]);
    let c = ks[0];
    ks.forEach(k => { if (x >= B[k] - 6) c = k; });
    return c;
  }

  function extractRows(pages) {
    let inTable = false, B = null, rows = [];
    for (const pg of pages) {
      const txt = pg.items.map(i => i.s).join(" ");
      if (!inTable) {
        if (!/critical\s+components?\s+information|list\s+of\s+critical\s+components/i.test(txt)) continue;
        inTable = true;
      } else if (/list of test equipment|supplementary information/i.test(txt) && !/Object\s*\/\s*part/i.test(txt)) {
        /* 補充說明在最後一頁表尾，之後才算結束 */
      }
      const items = pg.items.filter(i => i.s.trim() && !/^(DRAFT|REPORT|D|RAFT)$/i.test(i.s.trim()) && i.y < 735 && i.y > 40);
      const lines = lineOf(items);
      const b = findBounds(lines); if (b) B = b;
      if (!B) continue;
      /* 頁面最後出現 Supplementary information → 表在此結束 */
      let stopY = -1;
      const sup = lines.find(l => /^supplementary information/i.test(l.text));
      if (sup) stopY = sup.y;
      /* 依 y 間距分列：同一列內行距約 11–12，列與列之間 ≥ 16 */
      let cur = null, prevY = null;
      lines.forEach(ln => {
        if (sup && ln.y <= stopY + 1) return;
        if (/^(TRF No|Clause|Page \d|IEC 62368-1$|Report No)/i.test(ln.text) || /Object \/ part|Manufacturer\/?$/i.test(ln.text) && ln.y > 600 && b) {
          if (/Object \/ part/i.test(ln.text)) { prevY = null; cur = null; } return;
        }
        if (/^TABLE:|^4\.1\.2\b/i.test(ln.text)) return;
        if (cur === null || prevY === null || prevY - ln.y > 15) { cur = {obj: [], mfr: [], type: [], tech: [], std: [], mark: [], pg: pg.n}; rows.push(cur); }
        ln.items.forEach(it => cur[colOf(it.x, B)].push(it.s));
        prevY = ln.y;
      });
      if (sup) break;
    }
    return rows.map(r => {
      const o = {pg: r.pg};
      ["obj", "mfr", "type", "tech", "std", "mark"].forEach(k => o[k] = (r[k] || []).join(" ").replace(/\s+([,;:)\-])/g, "$1").replace(/\(\s+/g, "(").replace(/\s+/g, " ").trim());
      return o;
    }).filter(r => r.obj || r.mfr || r.type || r.tech);
  }

  /* ── 2. 列 → 組態 ── */
  const NUM = {one: 1, two: 2, three: 3, four: 4, "1": 1, "2": 2, "3": 3, "4": 4};
  const certified = r => {                    /* 該列有認證證據？ */
    const m = (r.mark + " " + r.std).trim();
    if (/^-+$/.test(r.mark) || !r.mark) return /CB issued|Test Report issued|\bUL \(?E|\(E\d+\)/i.test(m);
    return /CB issued|Test Report issued|\bUL\b|VDE|TÜV|TUV|\(E\d+\)|\(MH\d+\)/i.test(r.mark);
  };
  const isAlt = r => /\(alt\.?\)|alternate/i.test(r.obj);

  function infer(rows) {
    const out = {found: [], cfg: {}, notes: []};
    const add = (key, label, row, extra) => out.found.push(Object.assign({key, label, ev: (row.obj + " · " + [row.mfr, row.type].filter(Boolean).join(" ") + (row.mark ? " · " + row.mark : "")).slice(0, 140), pg: row.pg}, extra || {}));
    rows.forEach(r => {
      const o = r.obj.toLowerCase().replace(/\s+/g, "");   /* pdf 常把字拆開（"r ear"），先壓掉空白再比對 */
      const tech = r.tech.replace(/(\d)\s*\.\s*(\d)/g, "$1.$2").replace(/(?<=\d)\s+(?=\d)/g, "");
      if (/externalpoweradapter/.test(o) && !isAlt(r)) {
        const w = (tech.match(/(\d+(?:\.\d+)?)\s*W\b/i) || [])[1];
        if (w) { const wn = parseFloat(w);
          const pick = [65, 90, 120, 240].reduce((a, b) => Math.abs(b - wn) < Math.abs(a - wn) ? b : a);
          add("adp", "Adapter " + pick + "W", r, {w: pick, appr: certified(r)}); }
      } else if (/batterypack/.test(o) && !isAlt(r)) {
        const m = r.obj.replace(/\s+/g, "").match(/\((one|two|three|four|\d)provided\)/i);
        add("batt", "電池 " + (m ? NUM[m[1].toLowerCase()] : 1) + " 顆", r, {n: m ? NUM[m[1].toLowerCase()] : 1, appr: certified(r)});
      } else if (/coinbattery/.test(o) && !isAlt(r)) {
        add("coin", "Coin battery（RTC）", r, {appr: certified(r)});
      } else if (/barcodescanner/.test(o)) {
        const laser = /laser|60825/i.test(r.tech + " " + r.std);
        if (laser || !out.found.some(f => f.key === "scanner")) add("scanner", "Barcode scanner" + (laser ? "（Laser）" : ""), r, {appr: certified(r), laser});
      } else if (/^(systemfan|fan)/.test(o)) {
        add("fan", "風扇", r, {appr: certified(r)});
      } else if (/^plasticenclosure/.test(o) && !isAlt(r)) {
        add("plastic", "塑料／外殼", r, {appr: certified(r)});
      } else if (/led/.test(o) && /rear/.test(o) && !/cover/.test(o)) {
        if (!isAlt(r) || !out.found.some(f => f.key === "rearled")) add("rearled", "Rear cam LED", r, {appr: certified(r)});
      } else if (/^irled|frontcamera/.test(o)) {
        if (!isAlt(r) || !out.found.some(f => f.key === "ircam")) add("ircam", "IR cam（前鏡頭）", r, {appr: certified(r)});
      }
    });
    return out;
  }

  /* 把 infer() 的結果套到快速報價的 q 狀態 */
  function toConfig(found) {
    const c = {};
    found.forEach(f => {
      if (f.key === "adp" && c.adp === undefined) c.adp = {w: f.w, appr: f.appr};
      else if (f.key === "batt") c.batt = {n: f.n, appr: f.appr};
      else if (f.key === "fan") c.fan = {appr: f.appr};
      else if (["coin", "scanner", "plastic", "rearled", "ircam"].includes(f.key)) c[f.key] = {appr: f.appr};
    });
    return c;
  }

  const api = {extractRows, infer, toConfig};
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.CBParse = api;
})(typeof window !== "undefined" ? window : this);
