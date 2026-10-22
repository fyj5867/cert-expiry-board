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

**為什麼放在家目錄而不是 OneDrive**：`C:\Users\joyce_fan\OneDrive` 綁的是個人 Gmail 帳號
（`durabookp2533@gmail.com`）的個人版 OneDrive，不是公司的 Microsoft 365。安規的程式碼與資料
不應該同步到那裡。另外兩支 PWA 也都在家目錄。

## 本機預覽

```bash
node tools/serve.js . 8766
```

然後開 http://localhost:8766 。

## 上架（GitHub Pages）

比照另外兩支：

1. 在 GitHub 建一個 repository（例如 `safety-tools`），把這個資料夾的檔案推到 `main`。
2. repository → **Settings → Pages** → Source 選「Deploy from a branch」→ Branch `main`、資料夾 `/(root)` → Save。
3. 約一分鐘後出現網址 `https://fyj5867.github.io/safety-tools/`。
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

**已驗證**（本機預覽，375px 手機版面）
- 首頁與看板都正常顯示，導覽與返回連結可用
- `manifest.json` 讀得到，名稱與兩個尺寸的圖示都正確
- 沒有資料時顯示空狀態與匯入提示，不會壞掉
- 匯入 40 筆的測試檔 → 3 張分類卡、38 列表格（系統與電池同證書合併）、
  版本日期從 `sourceStamp` 帶出、剩餘天數依當日重算
- 重新整理後資料還在（`localStorage`）；「清除」會清乾淨並回到空狀態
- **全檔掃描確認程式碼裡沒有任何機型代號、型號、證書字號、到期日或內部網路路徑**

**未驗證**
- **Service Worker 沒辦法在預覽窗裡驗證**。註冊會失敗並回報
  `An unknown error occurred when fetching the script`，但 `fetch('./sw.js')` 本身是 200、
  content-type 正確。拿已知可正常運作的行動祕書做對照，**它在同一個預覽窗也是一模一樣的錯誤**，
  所以這是預覽環境的限制，不是程式問題。離線快取與「加入主畫面」要等實際部署到
  GitHub Pages 之後才驗得了。
- 實機（iPhone）的顯示與安裝流程尚未測試。

## 下一階段

| # | 項目 | 說明 |
|---|---|---|
| 2 | 跨裝置同步 ＋ 加密 | 移植行動祕書的做法：私密 Gist 儲存，但**內容先用 AES-GCM 加密**（金鑰＝PBKDF2(同步密語, 25 萬次)），沒有金鑰絕不上傳。secret gist 本身不是私密的（知道網址就能讀），所以加密是必要的，不是加分項 |
| 3 | 搬報價試算器 | 最大也最有價值。同時修好列印（`window.print()`）與 xlsx 匯出（SheetJS）。**牌價與報價履歷是公司資訊，絕對不能寫進程式碼或 commit**，只能走 App 的「匯入」放進自己的裝置 |
| 4 | 搬 cert-prep ／ erp-questions | 相對單純 |

第 2 階段也要一併移植行動祕書的 **App 鎖**（PIN／密碼，PBKDF2-SHA256 15 萬次，可用 Face ID 解鎖）。
