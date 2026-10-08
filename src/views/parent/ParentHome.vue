<template>
  <div class="parent-page">
    <!-- PIN Verification Gate -->
    <div class="pin-gate-modal" v-if="!isAuthenticated">
      <div class="gate-card">
        <h2>🔒 家長管理專區</h2>
        <p class="gate-sub">請輸入家長管理 PIN 碼 (預設為 8888)</p>
        <PinPad @submit="onParentPinSubmit" @cancel="$router.push('/home')" />
        <p class="gate-err" v-if="gateError">PIN 碼不正確！</p>
      </div>
    </div>

    <!-- Main Parent Console -->
    <div class="parent-container" v-else>
      <header class="parent-header">
        <button class="back-btn" @click="$router.push('/home')">◀ 返回首頁</button>
        <h1 class="parent-title">⚙️ 家長管理專區</h1>
        <button
          class="header-force-btn"
          :disabled="isUpdating"
          @click="handleForceUpdate"
          title="檢查最新程式碼與題庫並強制清除快取"
        >
          <span :class="{ 'spin-icon': isUpdating }">🔄</span>
          <span>{{ isUpdating ? '更新中...' : '🔄 檢查並強制更新' }}</span>
        </button>
      </header>

      <main class="console-body">
        <!-- 0. System Version & Force Update Card -->
        <section class="section-card update-card">
          <div class="sec-header">
            <span class="sec-icon">🔄</span>
            <div>
              <h3 class="sec-title">系統版本與強制更新</h3>
              <p class="sec-desc">遇題目修正或系統發布新版本時，一鍵強制清除本機快取、更新離線 Service Worker 並同步最新題庫</p>
            </div>
          </div>

          <div class="update-info-grid">
            <div class="update-info-pill">
              <span class="info-label">本機單字總數：</span>
              <span class="info-val">{{ wordsStore.words.length }} 字</span>
            </div>
            <div class="update-info-pill">
              <span class="info-label">題庫資料版本：</span>
              <span class="info-val code">{{ wordsStore.version || '1.0' }}</span>
            </div>
            <div class="update-info-pill">
              <span class="info-label">離線快取狀態：</span>
              <span class="info-val active">已啟用 (Service Worker)</span>
            </div>
          </div>

          <div class="actions-row">
            <button
              class="action-btn force-update-btn"
              :disabled="isUpdating"
              @click="handleForceUpdate"
            >
              <span :class="{ 'spin-icon': isUpdating }">🔄</span>
              {{ isUpdating ? '正在檢查與強制更新中...' : '🔄 檢查並強制更新' }}
            </button>
          </div>

          <div class="test-feedback" :class="{ ok: updateFeedback.ok, err: !updateFeedback.ok }" v-if="updateFeedback.message">
            {{ updateFeedback.message }}
          </div>
        </section>

        <!-- 1. Google Sheets Cloud Database -->
        <section class="section-card">
          <div class="sec-header">
            <span class="sec-icon">☁️</span>
            <div>
              <h3 class="sec-title">Google 試算表雲端資料庫設定</h3>
              <p class="sec-desc">串接 Google Apps Script，自動將各選手成績與錯題同步至你的 Google 試算表</p>
            </div>
          </div>

          <div class="form-row">
            <label>Apps Script 網頁應用程式網址 (結尾為 /exec)：</label>
            <input
              v-model="gasUrl"
              placeholder="https://script.google.com/macros/s/AKfy.../exec"
            />
          </div>

          <div class="form-row">
            <label>API 權杖 (Token，須與試算表 Config 分頁相同)：</label>
            <input
              v-model="gasToken"
              placeholder="於 Setup() 執行結果產生的隨機 Token"
            />
          </div>

          <div class="actions-row">
            <button class="action-btn test" :disabled="testing" @click="handleTestConnection">
              {{ testing ? '連線中...' : '🔌 測試連線與授權' }}
            </button>
            <button class="action-btn save" @click="saveCloudConfig">
              💾 儲存連線設定
            </button>
          </div>

          <div class="test-feedback" :class="{ ok: testResult.ok, err: !testResult.ok }" v-if="testResult.message">
            {{ testResult.message }}
          </div>
        </section>

        <!-- 2. Question Bank Management & Expansion -->
        <section class="section-card">
          <div class="sec-header">
            <span class="sec-icon">📚</span>
            <div>
              <h3 class="sec-title">題庫管理與擴充</h3>
              <p class="sec-desc">目前題庫共 {{ wordsStore.words.length }} 個單字 (版本：{{ wordsStore.version }})</p>
            </div>
          </div>

          <div class="bank-actions">
            <button class="sub-btn" @click="syncFromCloud" :disabled="syncing">
              {{ syncing ? '同步中...' : '🔄 從雲端試算表拉取最新題庫' }}
            </button>
            <button class="sub-btn highlight" @click="uploadDefaultToCloud" :disabled="uploading">
              {{ uploading ? '上傳中...' : '⬆️ 上傳本機 400 單至 Google 試算表' }}
            </button>
          </div>

          <!-- CSV Import section -->
          <div class="import-box">
            <h4 class="sub-title">📥 匯入新題庫 / 追加其他年度單字 (CSV 格式)</h4>
            <p class="sub-note">格式：id,bank,no,word,meaning,pos,category,alt_spellings</p>
            <textarea
              v-model="importCsvText"
              rows="4"
              placeholder="可直接貼上 CSV 內容，或點擊下方選擇檔案..."
            ></textarea>
            <div class="import-tools">
              <input type="file" accept=".csv" @change="onFilePicked" />
              <div class="btn-group">
                <button class="import-btn append" @click="executeImport(false)">
                  追加至題庫
                </button>
                <button class="import-btn overwrite" @click="executeImport(true)">
                  完全覆蓋題庫
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Official Exam Settings -->
        <section class="section-card">
          <div class="sec-header">
            <span class="sec-icon">⏱️</span>
            <div>
              <h3 class="sec-title">正式模擬測驗規則設定</h3>
              <p class="sec-desc">客製化測驗總題數、拼字/選擇比例與限時模式</p>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-row">
              <label>測驗總題數：</label>
              <input type="number" v-model.number="officialCount" min="5" max="100" />
            </div>

            <div class="form-row">
              <label>拼字題比例 (其餘為選擇題)：</label>
              <select v-model.number="spellRatio">
                <option :value="0.3">30% 拼字 (快速練習)</option>
                <option :value="0.5">50% 拼字 (標準平衡)</option>
                <option :value="0.7">70% 拼字 (加強拼音)</option>
                <option :value="1.0">100% 全拼字 (挑戰極限)</option>
              </select>
            </div>

            <div class="form-row">
              <label>時限模式：</label>
              <select v-model="timeLimitMode">
                <option value="total">整份試卷總時限</option>
                <option value="perQuestion">每題個別限時</option>
                <option value="none">不限時</option>
              </select>
            </div>

            <div class="form-row" v-if="timeLimitMode === 'total'">
              <label>總測驗時間 (分鐘)：</label>
              <input type="number" v-model.number="totalMinutes" min="1" max="60" />
            </div>

            <div class="form-row" v-if="timeLimitMode === 'perQuestion'">
              <label>每題作答時限 (秒)：</label>
              <input type="number" v-model.number="perQuestionSeconds" min="5" max="60" />
            </div>
          </div>

          <button class="action-btn save" style="margin-top: 14px;" @click="saveExamSettings">
            儲存測驗規則
          </button>
        </section>

        <!-- 4. Player Management -->
        <section class="section-card">
          <div class="sec-header">
            <span class="sec-icon">👦</span>
            <div>
              <h3 class="sec-title">選手帳號管理</h3>
              <p class="sec-desc">管理平板共用的選手名單與個人 PIN 碼</p>
            </div>
          </div>

          <div class="player-mgmt-list">
            <div v-for="p in playerStore.players" :key="p.id" class="mgmt-player-row">
              <div class="p-left">
                <Mascot :avatar="p.avatar" :size="36" />
                <span class="p-name">{{ p.nickname }}</span>
              </div>
              <div class="p-actions">
                <button class="mgmt-btn" @click="resetPlayerPin(p.id)">重設 PIN 為 1234</button>
                <button
                  class="mgmt-btn danger"
                  v-if="playerStore.players.length > 1"
                  @click="deletePlayer(p.id)"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Mascot from '../../components/Mascot.vue';
import { testGasConnection, uploadWordsToCloud } from '../../lib/api';
import { hashPin } from '../../lib/pin';
import { forceCheckAndRefreshPWA } from '../../pwa';
import { usePlayerStore } from '../../stores/player';
import { useSettingsStore } from '../../stores/settings';
import { useWordsStore } from '../../stores/words';
import type { Word } from '../../types';
import PinPad from '../PinPad.vue';

const playerStore = usePlayerStore();
const settingsStore = useSettingsStore();
const wordsStore = useWordsStore();

const isAuthenticated = ref(false);
const gateError = ref(false);

const isUpdating = ref(false);
const updateFeedback = ref<{ ok?: boolean; message: string }>({ message: '' });

async function handleForceUpdate() {
  if (isUpdating.value) return;
  isUpdating.value = true;
  updateFeedback.value = {
    ok: true,
    message: '正在檢查最新版本、清除本機快取與同步題庫...'
  };

  try {
    // 1. Force sync word bank (from GAS cloud or public words.json)
    const wordRes = await wordsStore.syncWordsFromCloud(true);

    // 2. Force check PWA Service Worker & clear Cache Storage
    await forceCheckAndRefreshPWA();

    updateFeedback.value = {
      ok: true,
      message: `更新完成！${wordRes.message} 系統將在 1 秒後重新整理載入最新版本...`
    };

    setTimeout(() => {
      window.location.reload();
    }, 1200);
  } catch (err: any) {
    updateFeedback.value = {
      ok: false,
      message: `更新失敗: ${err.message || '網路連線異常，請稍後重試'}`
    };
    isUpdating.value = false;
  }
}

const gasUrl = ref(settingsStore.config.gasUrl);
const gasToken = ref(settingsStore.config.gasToken);

const testing = ref(false);
const testResult = ref<{ ok?: boolean; message: string }>({ message: '' });

const syncing = ref(false);
const uploading = ref(false);

const officialCount = ref(settingsStore.config.officialCount);
const spellRatio = ref(settingsStore.config.spellRatio);
const timeLimitMode = ref(settingsStore.config.timeLimitMode);
const totalMinutes = ref(settingsStore.config.totalMinutes);
const perQuestionSeconds = ref(settingsStore.config.perQuestionSeconds);

const importCsvText = ref('');

function onParentPinSubmit(pin: string) {
  if (settingsStore.verifyParentPin(pin)) {
    isAuthenticated.value = true;
    gateError.value = false;
  } else {
    gateError.value = true;
  }
}

async function handleTestConnection() {
  testing.value = true;
  testResult.value = { message: '連線測試中...' };
  try {
    const res = await testGasConnection(gasUrl.value, gasToken.value);
    testResult.value = res;
  } finally {
    testing.value = false;
  }
}

function saveCloudConfig() {
  settingsStore.saveConfig({
    gasUrl: gasUrl.value,
    gasToken: gasToken.value
  });
  alert('雲端設定已儲存！');
}

function saveExamSettings() {
  settingsStore.saveConfig({
    officialCount: officialCount.value,
    spellRatio: spellRatio.value,
    timeLimitMode: timeLimitMode.value,
    totalMinutes: totalMinutes.value,
    perQuestionSeconds: perQuestionSeconds.value
  });
  alert('測驗規則已儲存！');
}

async function syncFromCloud() {
  syncing.value = true;
  try {
    const res = await wordsStore.syncWordsFromCloud(true);
    alert(res.message);
  } finally {
    syncing.value = false;
  }
}

async function uploadDefaultToCloud() {
  if (!confirm('即將把目前題庫 400 個單字覆蓋上傳至 Google 試算表 Words 分頁，確定嗎？')) return;
  uploading.value = true;
  try {
    const res = await uploadWordsToCloud(wordsStore.words, true);
    alert(res.message);
  } finally {
    uploading.value = false;
  }
}

function onFilePicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    importCsvText.value = ev.target?.result as string;
  };
  reader.readAsText(file);
}

async function executeImport(overwrite: boolean) {
  if (!importCsvText.value.trim()) {
    alert('請先貼上或選擇 CSV 檔案內容！');
    return;
  }

  const lines = importCsvText.value.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows: Word[] = [];

  for (let i = 1; i < lines.length; i++) {
    const tokens = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    if (tokens.length >= 5) {
      rows.push({
        id: tokens[0] || `W_${Date.now()}_${i}`,
        bank: tokens[1] || 'custom',
        no: parseInt(tokens[2] || String(i), 10),
        word: tokens[3],
        meaning: tokens[4],
        pos: tokens[5] || '',
        category: tokens[6] || '',
        alt_spellings: tokens[7] || '',
        enabled: true
      });
    }
  }

  if (rows.length === 0) {
    alert('CSV 解析結果為 0 筆，請檢查格式是否包含標題列與正確欄位！');
    return;
  }

  uploading.value = true;
  try {
    const res = await uploadWordsToCloud(rows, overwrite);
    if (res.ok) {
      await wordsStore.syncWordsFromCloud(true);
      alert(`匯入完成！${res.message}`);
      importCsvText.value = '';
    } else {
      alert(`匯入失敗: ${res.message}`);
    }
  } finally {
    uploading.value = false;
  }
}

async function resetPlayerPin(id: string) {
  const p = playerStore.players.find(item => item.id === id);
  if (!p) return;
  if (confirm(`確定將 ${p.nickname} 的 PIN 碼重設為預設值 1234 嗎？`)) {
    const newHash = await hashPin('1234', p.salt);
    await playerStore.updatePlayer(id, { pinHash: newHash });
    alert('重設完成！目前 PIN 碼為 1234');
  }
}

async function deletePlayer(id: string) {
  if (confirm('確定刪除此選手帳號嗎？')) {
    await playerStore.deletePlayer(id);
  }
}
</script>

<style scoped>
.parent-page {
  min-height: 100vh;
  background: var(--bg-main);
  padding: 20px;
}

.pin-gate-modal {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gate-card {
  background: white;
  padding: 36px 32px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
  max-width: 380px;
  width: 100%;
}

.gate-sub {
  color: var(--text-muted);
  font-size: 14px;
  margin: 6px 0 20px;
}

.gate-err {
  color: #ef4444;
  font-size: 13px;
  font-weight: 700;
  margin-top: 10px;
}

.parent-container {
  max-width: 840px;
  width: 100%;
  margin: 0 auto;
}

.parent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn {
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  padding: 6px 14px;
  background: white;
  border-radius: var(--radius-sm);
  border: 1px solid #cbd5e1;
}

.parent-title {
  font-family: var(--font-title);
  font-size: 26px;
  color: #1e3a8a;
}

.console-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.sec-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.sec-icon {
  font-size: 28px;
}

.sec-title {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.sec-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.form-row {
  margin-bottom: 14px;
}

.form-row label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 6px;
}

.form-row input, .form-row select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-size: 14px;
}

.actions-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.action-btn.test {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.action-btn.save {
  background: var(--color-primary);
  color: white;
}

.test-feedback {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
}

.test-feedback.ok {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.test-feedback.err {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.bank-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.sub-btn {
  padding: 10px 16px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.sub-btn.highlight {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.import-box {
  background: #f8fafc;
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px dashed #cbd5e1;
}

.sub-title {
  font-size: 14px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 4px;
}

.sub-note {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
}

.import-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.import-btn {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 800;
}

.import-btn.append {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.import-btn.overwrite {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .grid-2 { grid-template-columns: 1fr; }
}

.player-mgmt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mgmt-player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: var(--radius-sm);
  border: 1px solid #e2e8f0;
}

.p-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.p-name {
  font-weight: 800;
  color: #1e293b;
}

.p-actions {
  display: flex;
  gap: 8px;
}

.mgmt-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 4px;
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.mgmt-btn.danger {
  color: #dc2626;
  border-color: #fca5a5;
}

.header-force-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-sm);
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-force-btn:hover:not(:disabled) {
  background: #dbeafe;
}

.header-force-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.update-card {
  border-left: 4px solid var(--color-primary);
}

.update-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
}

.update-info-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: var(--radius-sm);
  border: 1px solid #e2e8f0;
}

.update-info-pill .info-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.update-info-pill .info-val {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.update-info-pill .info-val.code {
  font-family: var(--font-mono);
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.update-info-pill .info-val.active {
  color: #059669;
}

.action-btn.force-update-btn {
  background: #2563eb;
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

.action-btn.force-update-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.action-btn.force-update-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin-icon {
  display: inline-block;
  animation: spin 1s linear infinite;
}
</style>
