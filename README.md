# 國小英語單字王 (宜蘭縣國小英語單字王 400 單 Web App)

專為平板／手機觸控筆手寫與鍵盤拼字設計之國小英語競賽模擬測驗 Web App。已完整收錄宜蘭縣 113 學年度 Easy Go 國小英語單字王共 400 題完整單字、中文釋義、詞性與進階分類，支援 GitHub Pages 一鍵部署與 Google 試算表雲端資料庫整合。

---

## 🌟 核心特色

1. **競賽規格模擬與客製化**：
   - **正式模擬測驗**：預設 30 題混合測驗（中翻英手寫/鍵盤拼字 ＋ 英翻中四選一），倒數計時，時間到自動交卷。題數與時限可於家長專區彈性調整。
   - **每日迷你挑戰**：每日專屬 10 題快測，限時 3 分鐘，同日題目固定方便對照進步。
   - **自由練習模式**：自選 10 / 20 / 30 / 50 題，支援指定單字編號範圍（如 1~100 號）或專攻「待加強單字」，即時看正解。
   - **單字閃卡學習**：3D 翻牌記憶、支援道地美式發音（SpeechSynthesis）、自主標記「不熟 / 學習中 / 已熟」三階段熟練度。
2. **手寫與鍵盤雙軌作答**：
   - 英文四線格手寫板（支援 Apple Pencil / S Pen 防手掌誤觸與平滑貝茲曲線）。
   - 整合 Google 英文手寫辨識，放筆 600ms 自動辨識並提供候選字詞按鈕。
   - 支援專屬觸控螢幕鍵盤（含 Shift 大小寫切換、連字號、單引號）。
   - 嚴格大小寫判分機制：專有名詞（如 Taiwan, Friday, Christmas, Father's Day）首字大寫精確計分。
   - 交卷後核對清單（Review 頁）：左右對照作答與正解，支援單鍵翻轉判定。
3. **家庭多選手模式**：
   - 支援 1–4 位小朋友選手切換頭像與專屬 4 位數 PIN 碼，共用平板紀錄不混淆。
   - 家長管理專區，可檢視所有選手進度、設定 PIN 碼及自訂雲端題庫。
4. **雲端與離線雙軌**：
   - 支援 Google Sheets + Apps Script 雙向同步（自動記錄答錯單字於試算表）。
   - 支援 PWA 離線快取，沒網路照常練，重新連線後一鍵上傳暫存成績。
   - 題庫原卷對照校對表：內建 `public/proof.html`，可左右對照 5 頁原始掃描試卷進行快速校核。

---

## 🚀 GitHub Pages 部署步驟

本專案已設定好自動化 GitHub Actions Workflow：

1. **開啟 GitHub Pages 設定**：
   - 前往你的 GitHub 專案頁面：`https://github.com/hippoking1/English-word-competition`
   - 點擊上方 **Settings** ➜ 左側欄位選 **Pages**。
   - 在 **Build and deployment** 下方的 **Source**，切換為 **GitHub Actions**。
2. **自動建置與發布**：
   - 程式碼 Push 至 `main` 分支後，GitHub Actions 即會自動執行資料驗證、TypeScript 編譯、打包並發布至 GitHub Pages。
   - 發布完成後的網頁網址為：`https://hippoking1.github.io/English-word-competition/`
3. **在平板上安裝為 App (PWA)**：
   - **iPad (Safari)**：打開網址 ➜ 點擊分享按鈕 ➜ 選擇「**加入主畫面**」。
   - **Android 平板 (Chrome)**：打開網址 ➜ 點擊右上角選單 ➜ 選擇「**加到主畫面**」或「**安裝應用程式**」。

---

## 📊 Google 試算表（成績與題庫）設定步驟

若希望將測驗成績與錯題同步到自己的 Google 雲端試算表：

1. 新增一份空白 Google 試算表（命名例如：`英語單字王競賽成績總表`）。
2. 點擊頂部選單的 **擴充功能 ➜ Apps Script**。
3. 將本專案 `apps-script/Code.gs` 與 `apps-script/Setup.gs` 複製貼上到專案編輯器中。
4. 在上方函式下拉選單選擇 `setup`，點擊「執行」（首次執行需完成 Google 帳號授權）。
   - `setup()` 會自動建立 4 個工作表：`Words`、`Players`、`Attempts`、`Config`，並在執行紀錄中顯示一組專屬的 `api_token`。
5. 點擊右上角 **部署 ➜ 新增部署作業**：
   - 種類選 **網頁應用程式**。
   - 說明填寫：`v1.0`。
   - **執行身分**：選「**我** (Me)」。
   - **誰可以存取**：選「**任何人** (Anyone)」。
   - 點擊部署後，複製得到的「**網頁應用程式網址 (URL)**」（結尾為 `/exec`）。
6. 回到本 App 的「家長管理專區」（預設 PIN 碼 `8888`），貼上該網址與 `api_token` 點擊儲存，並點擊「測試連線」驗證！
7. 點擊「上傳本機 400 單至 Google 試算表」，試算表的 `Words` 分頁便會自動填滿完整單字庫！

---

## 📝 題庫擴充方法

未來若要新增其他年度試題或自訂練習題庫：

1. **直接在 Google 試算表新增**：
   - 在試算表的 `Words` 分頁直接追加一列（填寫 id, bank, no, word, meaning, pos, category 等欄位）。
   - 編輯後 `onEdit` 會自動刷新題庫版本號，平板下次打開 App 便會自動下載最新題庫。
2. **在家長管理專區匯入**：
   - 家長專區提供 CSV 上傳/貼上功能，可選擇「追加」或「完全覆蓋」。
3. **修改本機題庫**：
   - 編輯 `data/words.csv`。
   - 執行 `npm run words` 產出 `public/words.json`。
   - 執行 `npm run validate` 確認格式完全正確無誤。

---

## 🛠 本地開發指令

```bash
# 安裝依賴
npm install

# 單字庫建置與嚴格驗證
npm run words
npm run validate

# 啟動本地開發伺服器
npm run dev

# 建置生產版本
npm run build

# 本地預覽生產版本
npm run preview
```
