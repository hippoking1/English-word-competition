<template>
  <div class="review-page">
    <header class="review-header">
      <div class="header-info">
        <h1 class="review-title">📝 作答成果核對</h1>
        <p class="review-subtitle">
          請檢視作答內容，系統已自動初判。若辨識有誤差，可點擊「翻轉判定」按鈕修改對錯。
        </p>
      </div>

      <button class="confirm-submit-btn" @click="handleFinalSubmit">
        完成核對並送出成績 ➔
      </button>
    </header>

    <!-- Review items list -->
    <main class="review-list">
      <div
        v-for="(item, idx) in examStore.currentExam"
        :key="item.key"
        class="review-card"
        :class="getJudgeClass(item.key)"
      >
        <div class="card-index">第 {{ idx + 1 }} 題</div>

        <!-- Question content -->
        <div class="card-body">
          <div class="prompt-col">
            <span class="kind-label">
              {{ item.kind === 'spell' ? '✍️ 拼字' : '🎯 選擇' }}
            </span>
            <div class="prompt-title">
              {{ item.kind === 'spell' ? item.word.meaning : item.word.word }}
            </div>
            <div class="std-answer">
              標準答案：<b class="ans-text">{{ item.kind === 'spell' ? item.word.word : item.correctMeaning }}</b>
            </div>
          </div>

          <!-- User input col -->
          <div class="user-col">
            <span class="user-label">你的作答：</span>

            <!-- Handwriting preview -->
            <div class="user-ink" v-if="getAnswer(item.key)?.userInk?.length">
              <InkReplay :ink="getAnswer(item.key)?.userInk" />
            </div>

            <!-- Typed text or Choice -->
            <div class="user-text">
              <span v-if="item.kind === 'spell'">
                {{ getAnswer(item.key)?.userText || '(未作答)' }}
              </span>
              <span v-else>
                {{ getAnswer(item.key)?.choiceSelected || '(未作答)' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Judge toggle action -->
        <div class="card-actions">
          <div class="judge-status" :class="getAnswer(item.key)?.finalJudge">
            <span v-if="getAnswer(item.key)?.finalJudge === 'ok'">✓ 答對</span>
            <span v-else-if="getAnswer(item.key)?.finalJudge === 'ng'">✕ 答錯</span>
            <span v-else>？ 待判定</span>
          </div>

          <button class="toggle-btn" @click="toggleJudge(item.key)">
            翻轉判定
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import InkReplay from '../components/InkReplay.vue';
import { useExamStore } from '../stores/exam';
import type { AnswerItem } from '../types';

const router = useRouter();
const examStore = useExamStore();

function getAnswer(key: string): AnswerItem | undefined {
  return examStore.answers[key];
}

function getJudgeClass(key: string): string {
  const ans = getAnswer(key);
  if (!ans) return 'status-ng';
  if (ans.finalJudge === 'ok') return 'status-ok';
  if (ans.finalJudge === 'ng') return 'status-ng';
  return 'status-unsure';
}

function toggleJudge(key: string) {
  examStore.toggleJudge(key);
}

async function handleFinalSubmit() {
  await examStore.finishExam();
  router.push('/result');
}

onMounted(() => {
  if (examStore.currentExam.length === 0) {
    router.push('/home');
  }
});
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
  padding: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 900px;
  width: 100%;
  margin: 0 auto 20px;
  background: white;
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
  gap: 16px;
}

.review-title {
  font-family: var(--font-title);
  font-size: 26px;
  color: #1e3a8a;
  margin-bottom: 4px;
}

.review-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.confirm-submit-btn {
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 800;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-submit-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
}

.review-list {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: var(--radius-md);
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  box-shadow: var(--shadow-sm);
  gap: 16px;
}

.review-card.status-ok {
  border-color: #a7f3d0;
  background: #f0fdf4;
}

.review-card.status-ng {
  border-color: #fecaca;
  background: #fef2f2;
}

.review-card.status-unsure {
  border-color: #fde68a;
  background: #fffbeb;
}

.card-index {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 14px;
  color: #64748b;
  min-width: 60px;
}

.card-body {
  flex: 1;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.prompt-col {
  flex: 1;
  min-width: 180px;
}

.kind-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.prompt-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 2px 0 6px;
}

.std-answer {
  font-size: 13px;
  color: #475569;
}

.ans-text {
  color: #059669;
  font-weight: 800;
  font-size: 15px;
}

.user-col {
  flex: 1;
  min-width: 180px;
}

.user-label {
  font-size: 11px;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}

.user-ink {
  width: 100%;
  max-width: 280px;
  height: 75px;
  margin-bottom: 6px;
}

.user-text {
  font-weight: 800;
  font-size: 17px;
  color: #1e293b;
}

.card-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.judge-status {
  font-size: 14px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 999px;
}

.judge-status.ok {
  background: #d1fae5;
  color: #065f46;
}

.judge-status.ng {
  background: #fee2e2;
  color: #991b1b;
}

.judge-status.unsure {
  background: #fef3c7;
  color: #92400e;
}

.toggle-btn {
  padding: 4px 10px;
  border-radius: 6px;
  background: white;
  border: 1px solid #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.toggle-btn:hover {
  background: #f1f5f9;
}
</style>
