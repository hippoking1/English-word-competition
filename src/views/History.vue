<template>
  <div class="history-page">
    <header class="history-header">
      <button class="back-btn" @click="$router.push('/home')">◀ 返回首頁</button>
      <h2 class="title">📊 測驗歷史紀錄</h2>
      <div class="summary-badge">共 {{ attempts.length }} 次測驗</div>
    </header>

    <main class="history-content">
      <div class="empty-box" v-if="attempts.length === 0">
        <p>目前尚無任何測驗紀錄，快去挑戰一場測驗吧！</p>
        <button class="start-btn" @click="$router.push('/home')">前往測驗</button>
      </div>

      <div class="attempt-list" v-else>
        <div v-for="att in attempts" :key="att.id" class="attempt-card">
          <div class="card-left">
            <div class="mode-row">
              <span class="mode-tag">{{ getModeName(att.mode) }}</span>
              <span class="date-str">{{ formatDate(att.startedAt) }}</span>
            </div>
            <div class="stats-line">
              拼字：{{ att.spellCorrect }}/{{ att.spellTotal }} · 選擇：{{ att.choiceCorrect }}/{{ att.choiceTotal }} · 耗時：{{ Math.floor(att.durationSec / 60) }}分{{ att.durationSec % 60 }}秒
            </div>
            <div class="wrong-preview" v-if="att.wrongWords && att.wrongWords.length > 0">
              錯題：{{ att.wrongWords.join(', ') }}
            </div>
          </div>

          <div class="card-right">
            <span class="score-num" :class="getScoreColor(att.score)">{{ att.score }}</span>
            <span class="score-unit">分</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getLocalAttempts } from '../lib/db';
import { usePlayerStore } from '../stores/player';
import type { ExamAttempt } from '../types';

const playerStore = usePlayerStore();
const attempts = ref<ExamAttempt[]>([]);

function getModeName(mode: string): string {
  if (mode === 'official') return '🥇 正式模擬';
  if (mode === 'mini') return '⚡ 每日挑戰';
  if (mode === 'unfamiliar') return '💪 弱點專攻';
  return '🎯 自由練習';
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green';
  if (score >= 70) return 'text-blue';
  return 'text-orange';
}

onMounted(async () => {
  const pid = playerStore.currentPlayer?.id;
  attempts.value = await getLocalAttempts(pid);
});
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background: var(--bg-main);
  padding: 16px 20px 40px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 720px;
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

.summary-badge {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 14px;
  color: #64748b;
}

.history-content {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.empty-box {
  background: white;
  padding: 40px 20px;
  text-align: center;
  border-radius: var(--radius-lg);
  border: 1px solid #e2e8f0;
}

.start-btn {
  margin-top: 14px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  font-weight: 800;
  border-radius: var(--radius-sm);
}

.attempt-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attempt-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 18px 22px;
  border-radius: var(--radius-md);
  border: 1px solid #e2e8f0;
  box-shadow: var(--shadow-sm);
}

.card-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mode-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-tag {
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 4px;
}

.date-str {
  font-size: 13px;
  color: #64748b;
}

.stats-line {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.wrong-preview {
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

.card-right {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-num {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: 900;
}

.score-num.text-green { color: #059669; }
.score-num.text-blue { color: #2563eb; }
.score-num.text-orange { color: #ea580c; }

.score-unit {
  font-size: 14px;
  font-weight: 800;
  color: #64748b;
}
</style>
