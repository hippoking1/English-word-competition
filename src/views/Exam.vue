<template>
  <div class="exam-page" v-if="examStore.currentItem">
    <!-- Top status bar -->
    <header class="exam-header">
      <button class="quit-btn" @click="handleQuit">✕ 放棄</button>

      <div class="header-center">
        <span class="q-type-badge" :class="examStore.currentItem.kind">
          {{ examStore.currentItem.kind === 'spell' ? '✍️ 中翻英拼字' : '🎯 英翻中選擇' }}
        </span>
        <span class="q-counter">
          第 {{ examStore.currentIndex + 1 }} / {{ examStore.currentExam.length }} 題
        </span>
      </div>

      <div class="header-right">
        <CountdownTimer :seconds="examStore.timeRemainingSec" />
        <button class="finish-btn" @click="handleEarlyFinish">交卷</button>
      </div>
    </header>

    <!-- Progress dots -->
    <div class="progress-container">
      <ProgressDots
        :total="examStore.currentExam.length"
        :current="examStore.currentIndex"
        :answers="examStore.answers"
        :items="examStore.currentExam"
        @select="jumpToIndex"
      />
    </div>

    <!-- Active Question Card -->
    <main class="question-container">
      <SpellCard
        v-if="examStore.currentItem.kind === 'spell'"
        :word="examStore.currentItem.word"
        :initial-ink="currentAnswer?.userInk"
        :initial-text="currentAnswer?.userText"
        :auto-speak="settingsStore.config.autoSpeak"
        :speech-rate="settingsStore.config.speechRate"
        @update="onSpellUpdate"
      />

      <ChoiceCard
        v-else-if="examStore.currentItem.kind === 'choice'"
        :word="examStore.currentItem.word"
        :options="examStore.currentItem.options || []"
        :initial-selected="currentAnswer?.choiceSelected"
        :auto-speak="settingsStore.config.autoSpeak"
        :speech-rate="settingsStore.config.speechRate"
        @select="onChoiceSelect"
      />
    </main>

    <!-- Bottom navigation controls -->
    <footer class="exam-footer">
      <button
        class="nav-action-btn prev"
        :disabled="examStore.currentIndex === 0"
        @click="prevQuestion"
      >
        ◀ 上一題
      </button>

      <div class="answered-summary">
        已答 {{ examStore.answeredCount }} / {{ examStore.currentExam.length }}
      </div>

      <button
        v-if="!examStore.isLastQuestion"
        class="nav-action-btn next"
        @click="nextQuestion"
      >
        下一題 ▶
      </button>
      <button
        v-else
        class="nav-action-btn submit"
        @click="confirmFinish"
      >
        完成並進入核對 ✓
      </button>
    </footer>

    <!-- Confirm Submit Dialog -->
    <div class="modal-overlay" v-if="showFinishDialog">
      <div class="modal-content">
        <h3>確定要交卷嗎？</h3>
        <p class="summary-text">
          總題數：{{ examStore.currentExam.length }} 題<br />
          已作答：{{ examStore.answeredCount }} 題<br />
          <span v-if="unansweredCount > 0" class="warn-text">
            尚有 {{ unansweredCount }} 題未作答！
          </span>
        </p>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="showFinishDialog = false">繼續作答</button>
          <button class="btn-confirm" @click="proceedToReview">確認交卷</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ChoiceCard from '../components/ChoiceCard.vue';
import CountdownTimer from '../components/CountdownTimer.vue';
import ProgressDots from '../components/ProgressDots.vue';
import SpellCard from '../components/SpellCard.vue';
import { judgeSpelling } from '../lib/grading';
import { useExamStore } from '../stores/exam';
import { useSettingsStore } from '../stores/settings';
import type { Ink } from '../types';

const router = useRouter();
const examStore = useExamStore();
const settingsStore = useSettingsStore();

const showFinishDialog = ref(false);

const currentAnswer = computed(() => {
  if (!examStore.currentItem) return null;
  return examStore.answers[examStore.currentItem.key] || null;
});

const unansweredCount = computed(() => {
  return examStore.currentExam.length - examStore.answeredCount;
});

function onSpellUpdate(payload: { text: string; ink?: Ink; candidates?: string[] }) {
  if (!examStore.currentItem) return;
  const word = examStore.currentItem.word;
  const judge = judgeSpelling(
    word,
    payload.text,
    payload.candidates,
    settingsStore.config.requireExactCase
  );

  examStore.recordAnswer(examStore.currentItem.key, {
    userText: payload.text,
    ink: payload.ink,
    candidates: payload.candidates,
    autoJudge: judge.result
  });
}

function onChoiceSelect(meaning: string) {
  if (!examStore.currentItem) return;
  const isOk = meaning === examStore.currentItem.correctMeaning;
  examStore.recordAnswer(examStore.currentItem.key, {
    choiceSelected: meaning,
    autoJudge: isOk ? 'ok' : 'ng'
  });
}

function prevQuestion() {
  if (examStore.currentIndex > 0) {
    examStore.currentIndex--;
  }
}

function nextQuestion() {
  if (examStore.currentIndex < examStore.currentExam.length - 1) {
    examStore.currentIndex++;
  }
}

function jumpToIndex(idx: number) {
  examStore.currentIndex = idx;
}

function handleEarlyFinish() {
  showFinishDialog.value = true;
}

function confirmFinish() {
  showFinishDialog.value = true;
}

function handleQuit() {
  if (confirm('確定要放棄本次測驗嗎？不會記錄成績。')) {
    examStore.stopTimer();
    router.push('/home');
  }
}

function proceedToReview() {
  showFinishDialog.value = false;
  router.push('/review');
}

onMounted(() => {
  if (examStore.currentExam.length === 0) {
    router.push('/home');
  }
});

onUnmounted(() => {
  examStore.stopTimer();
});
</script>

<style scoped>
.exam-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-main);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.quit-btn {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: #f1f5f9;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.q-type-badge {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
}

.q-type-badge.spell {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.q-type-badge.choice {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.q-counter {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 15px;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.finish-btn {
  padding: 6px 14px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-weight: 800;
  color: #334155;
  font-size: 13px;
}

.finish-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.progress-container {
  background: white;
  border-bottom: 1px solid var(--border-light);
  padding: 4px 16px;
}

.question-container {
  flex: 1;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
}

.exam-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-top: 1px solid var(--border-light);
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
}

.nav-action-btn {
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-action-btn.prev {
  background: #f1f5f9;
  color: #475569;
}

.nav-action-btn.prev:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-action-btn.next {
  background: var(--color-primary);
  color: white;
}

.nav-action-btn.submit {
  background: var(--color-success);
  color: white;
}

.answered-summary {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal-content {
  background: white;
  padding: 28px;
  border-radius: var(--radius-lg);
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-xl);
}

.summary-text {
  margin: 16px 0 20px;
  font-size: 15px;
  line-height: 1.6;
  color: #334155;
}

.warn-text {
  color: #ef4444;
  font-weight: 800;
  display: block;
  margin-top: 6px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 10px 0;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 15px;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-confirm {
  background: var(--color-primary);
  color: white;
}
</style>
