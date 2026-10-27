# 安規工具 — 獨立網頁 App（PWA）

把安規的幾個工具從 claude.ai artifact 搬成獨立 PWA，做法比照 `~/Mobile-secretary`（行動祕書）
與 `~/Foodie-control`（Healthy Care）：GitHub Pages 部署、加入主畫面、離線可開、不需要登入任何帳號。

**目前是第一階段（架構驗證）**，只有效期看板。

## 資料夾內容

```
index.html          首頁／導覽
expiry-board.html   認證效期看板
manifest.json       PWA 設定（加入主畫面的名稱、圖示、全螢幕）
sw.js               Service Worker：同源 network-first、Google Fonts cache-first
icon-192.png
icon-512.png        App 圖示
tools/serve.js      本機預覽用的小型靜態伺服器
.claude/launch.json 預覽設定（不進版控）
```

**為什麼放在家目錄而不是 OneDrive**：這台機器上的 OneDrive 綁的是個人帳號，不是公司的
Microsoft 365，安規的程式碼與資料不應該同步到那裡。另外兩支 PWA 也都在家目錄。

## 本機預覽

```bash
node tools/serve.js . 8766
```

然後開 http://localhost:8766 。

## 上架（GitHub Pages）

比照另外兩支：

1. repository：`fyj5867/cert-expiry-board`，把這個資料夾的檔案推到 `main`。
2. repository → **Settings → Pages** → Source 選「Deploy from a branch」→ Branch `main`、資料夾 `/(root)` → Save。
3. 約一分鐘後出現網址 `https://fyj5867.github.io/cert-expiry-board/`。
4. 手機用 Safari（iPhone）或 Chrome（Android）開那個網址 → **加入主畫面**。

改版後記得把 `sw.js` 的 `CACHE` 版本號 +1，手機才會拿到新版。

## 資料怎麼進來

**程式碼裡沒有任何證書資料。** GitHub Pages 是公開網址，而且就算用 private repo，
發布出去的站台本身仍是公開可存取的（private 只保護原始碼，不保護網站）。
所以資料一律由使用者自己匯入，只存在自己裝置的 `localStorage`（鍵名 `safety.certs.v1`）。

1. 電腦上跑 `update-cert-board.ps1 -Json <輸出路徑>` 產生 JSON
2. 把那個 JSON 傳到手機（OneDrive／iCloud 都可以）
3. 看板頁按「匯入效期資料」選那個檔

看板也收自己「匯出備份」產生的檔案。兩種格式都認得：

| 來源 | 形狀 |
|---|---|
| `update-cert-board.ps1 -Json` | `{ sourceStamp, items: [{ model, cert, kind, due, spec, applies }] }` |
| 看板的「匯出備份」 | `{ v, stamp, items: [{ project, cert, kind, due, spec, applies }] }` |
| 純陣列 | `[{ project, cert, due, … }]` |

必要欄位只有三個：`project`（或 `model`）、`cert`、`due`（`yyyy/MM/dd` 或 `yyyy-MM-dd`）。
解不出來的列會被跳過。

**測試用的檔案放 `_private/`**（已在 `.gitignore`，不會進版控）。

第二階段接上加密同步之後，就不用再手動搬檔。

## 已驗證 / 未驗證

**線上實測**（2026/10/27，https://fyj5867.github.io/cert-expiry-board/ ）
- 8 個檔案全部 200，`sw.js` 的 content-type 是 `application/javascript`
- **Service Worker 註冊成功並 activated**，scope `/cert-expiry-board/`，
  `safety-v2` 快取進了 7 個外殼檔（首頁、看板、sync.js、manifest、兩個圖示）
- manifest 讀得到：名稱「安規工具」、`display: standalone`、192／512 兩個圖示都在
- 空狀態正常
- 用 file input 實際匯入 40 筆測試檔 → 3 張分類卡、38 列（ADAPTER 5 顆／17 張、
  系統 13 張、電池 8 張／10 筆合併）、版本日期帶出 2026-10-15、
  已過期 2 筆與 6 個月內到期 2 筆的標籤都對
- **剩餘天數依瀏覽當日重算**，不是沿用檔案裡的舊值
- 重新整理後資料還在；「清除」清得乾淨並回到空狀態
- 375px 手機版面正常，不會橫向捲動

**未驗證**
- **真正的離線開啟**。外殼已經在 `safety-v2` 快取裡（確認過 `caches.match` 拿得到看板頁），
  但要關掉網路才驗得了 fallback，瀏覽器這邊沒辦法斷網 —— 手機開飛航模式點一下 App 圖示就知道。
- 實機（iPhone）的「加入主畫面」流程。
- 第二階段的 Gist 同步尚未實際連線測試。


## 下一階段

| # | 項目 | 說明 |
|---|---|---|
| 2 | 跨裝置同步 ＋ 加密 | 移植行動祕書的做法：私密 Gist 儲存，但**內容先用 AES-GCM 加密**（金鑰＝PBKDF2(同步密語, 25 萬次)），沒有金鑰絕不上傳。secret gist 本身不是私密的（知道網址就能讀），所以加密是必要的，不是加分項 |
| 3 | 搬報價試算器 | 最大也最有價值。同時修好列印（`window.print()`）與 xlsx 匯出（SheetJS）。**牌價與報價履歷是公司資訊，絕對不能寫進程式碼或 commit**，只能走 App 的「匯入」放進自己的裝置 |
| 4 | 搬 cert-prep ／ erp-questions | 相對單純 |

第 2 階段也要一併移植行動祕書的 **App 鎖**（PIN／密碼，PBKDF2-SHA256 15 萬次，可用 Face ID 解鎖）。
