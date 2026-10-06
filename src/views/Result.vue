<template>
  <div class="result-page" v-if="attempt">
    <StarBurst :score="attempt.score" />

    <div class="result-card">
      <div class="header">
        <Mascot :avatar="playerStore.currentPlayer?.avatar" :size="64" />
        <h1 class="congrats-title">{{ getTitleByScore(attempt.score) }}</h1>
        <p class="subtitle">{{ attempt.playerName }} 的測驗結算成績</p>
      </div>

      <!-- Score Banner -->
      <div class="score-banner">
        <div class="score-display">
          <span class="score-num">{{ attempt.score }}</span>
          <span class="score-unit">分</span>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">拼字答對</span>
            <span class="stat-val">{{ attempt.spellCorrect }} / {{ attempt.spellTotal }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">選擇答對</span>
            <span class="stat-val">{{ attempt.choiceCorrect }} / {{ attempt.choiceTotal }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">測驗時間</span>
            <span class="stat-val">{{ formatDuration(attempt.durationSec) }}</span>
          </div>
        </div>
      </div>

      <!-- Wrong words section -->
      <div class="wrong-section" v-if="attempt.wrongWords && attempt.wrongWords.length > 0">
        <h3 class="section-title">
          ❌ 本次待加強單字 (共 {{ attempt.wrongWords.length }} 個)
        </h3>
        <div class="wrong-chips">
          <div v-for="w in attempt.wrongWords" :key="w" class="wrong-chip">
            <span class="chip-word">{{ w }}</span>
            <button class="chip-speak" @click="speakWord(w)">🔊</button>
          </div>
        </div>
      </div>
      <div class="all-correct-box" v-else>
        🎉 太厲害了！全部單字答對，無任何錯題！
      </div>

      <!-- Cloud sync note -->
      <div class="sync-status">
        <span v-if="attempt.syncedToCloud">☁️ 成績已成功同步至 Google 試算表</span>
        <span v-else>📦 成績已儲存於本機 (待連線後自動上傳)</span>
      </div>

      <!-- Footer Buttons -->
      <div class="footer-buttons">
        <button class="action-btn secondary" @click="$router.push('/home')">
          回首頁
        </button>
        <button class="action-btn primary" @click="retryExam">
          再測驗一次
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Mascot from '../components/Mascot.vue';
import StarBurst from '../components/StarBurst.vue';
import { sound } from '../lib/audio';
import { tts } from '../lib/tts';
import { useExamStore } from '../stores/exam';
import { usePlayerStore } from '../stores/player';

const router = useRouter();
const examStore = useExamStore();
const playerStore = usePlayerStore();

const attempt = computed(() => examStore.activeAttempt);

function getTitleByScore(score: number): string {
  if (score >= 95) return '🏆 完美奪冠！單字王！';
  if (score >= 85) return '🌟 表現極佳！太棒了！';
  if (score >= 70) return '👍 成績優良！繼續保持！';
  return '💪 加油！再接再厲！';
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} 分 ${s} 秒`;
}

function speakWord(w: string) {
  tts.speak(w);
}

async function retryExam() {
  if (attempt.value) {
    await examStore.startExam(attempt.value.mode, { bank: attempt.value.bank });
    router.push('/exam');
  } else {
    router.push('/home');
  }
}

onMounted(() => {
  if (!attempt.value) {
    router.push('/home');
    return;
  }
  sound.playComplete();
});
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.result-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 36px 32px;
  max-width: 560px;
  width: 100%;
  box-shadow: var(--shadow-xl);
  text-align: center;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.congrats-title {
  font-family: var(--font-title);
  font-size: 28px;
  color: #1e3a8a;
  margin-top: 4px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.score-banner {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-md);
  padding: 24px 20px;
  margin: 20px 0;
}

.score-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  color: var(--color-primary-dark);
}

.score-num {
  font-family: var(--font-title);
  font-size: 64px;
  font-weight: 900;
  line-height: 1;
}

.score-unit {
  font-size: 20px;
  font-weight: 800;
  color: #64748b;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-top: 18px;
  border-top: 1px solid #cbd5e1;
  padding-top: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.stat-val {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
}

.wrong-section {
  text-align: left;
  margin: 16px 0;
}

.section-title {
  font-size: 15px;
  font-weight: 800;
  color: #dc2626;
  margin-bottom: 10px;
}

.wrong-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
}

.wrong-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 999px;
  color: #991b1b;
  font-weight: 700;
  font-size: 14px;
}

.chip-speak {
  font-size: 14px;
  cursor: pointer;
}

.all-correct-box {
  padding: 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: var(--radius-sm);
  color: #065f46;
  font-weight: 800;
  font-size: 15px;
  margin: 16px 0;
}

.sync-status {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 20px;
}

.footer-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px 0;
  border-radius: var(--radius-md);
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
}

.action-btn.secondary {
  background: #f1f5f9;
  color: #334155;
}
</style>
