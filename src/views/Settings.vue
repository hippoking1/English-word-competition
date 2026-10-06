<template>
  <div class="settings-page">
    <header class="settings-header">
      <button class="back-btn" @click="$router.push('/home')">◀ 返回首頁</button>
      <h2 class="title">⚙️ 個人測驗設定</h2>
      <div style="width: 70px;"></div>
    </header>

    <main class="settings-card">
      <div class="setting-item">
        <label class="item-label">
          <span>題目自動朗讀發音</span>
          <span class="sub-label">換題時由美式發音引擎自動唸出單字</span>
        </label>
        <input type="checkbox" v-model="form.autoSpeak" class="switch-box" />
      </div>

      <div class="setting-item">
        <label class="item-label">
          <span>英語朗讀語速</span>
          <span class="sub-label">預設 0.85 適合國小學生聽辨字母拼讀</span>
        </label>
        <select v-model="form.speechRate" class="select-box">
          <option :value="0.7">0.7x (稍慢清楚)</option>
          <option :value="0.85">0.85x (標準推薦)</option>
          <option :value="1.0">1.0x (一般常速)</option>
        </select>
      </div>

      <div class="setting-item">
        <label class="item-label">
          <span>拼字嚴格區分大小寫</span>
          <span class="sub-label">專有名詞（如 Taiwan, Christmas, Friday）首字必須大寫</span>
        </label>
        <input type="checkbox" v-model="form.requireExactCase" class="switch-box" />
      </div>

      <div class="save-bar">
        <button class="save-btn" @click="save">儲存設定</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '../stores/settings';

const router = useRouter();
const settingsStore = useSettingsStore();

const form = reactive({
  autoSpeak: settingsStore.config.autoSpeak,
  speechRate: settingsStore.config.speechRate,
  requireExactCase: settingsStore.config.requireExactCase
});

function save() {
  settingsStore.saveConfig({
    autoSpeak: form.autoSpeak,
    speechRate: form.speechRate,
    requireExactCase: form.requireExactCase
  });
  alert('設定已儲存！');
  router.push('/home');
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-main);
  padding: 16px 20px 40px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 600px;
  width: 100%;
  margin: 0 auto 20px;
}

.back-btn {
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  padding: 6px 12px;
  background: white;
  border-radius: var(--radius-sm);
  border: 1px solid #cbd5e1;
}

.title {
  font-family: var(--font-title);
  font-size: 24px;
  color: #1e3a8a;
}

.settings-card {
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  background: white;
  padding: 28px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 18px;
}

.item-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
}

.sub-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}

.switch-box {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.select-box {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-weight: 700;
}

.save-bar {
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  padding: 12px 28px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 800;
}
</style>
