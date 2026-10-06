<template>
  <div class="choice-card">
    <!-- Question header -->
    <div class="question-header">
      <div class="word-info">
        <span class="prompt-label">請選出正確的中文意思：</span>
        <h1 class="target-word">{{ word.word }}</h1>
        <div class="meta-tags">
          <span class="tag pos" v-if="word.pos">{{ word.pos }}</span>
          <span class="tag cat" v-if="word.category">{{ word.category }}</span>
        </div>
      </div>

      <button class="speak-btn" @click="speakWord" title="點擊朗讀發音">
        <span class="speaker-icon">🔊</span>
        <span class="speak-text">聽發音</span>
      </button>
    </div>

    <!-- 4 Options grid -->
    <div class="options-grid">
      <button
        v-for="(opt, idx) in options"
        :key="idx"
        class="option-btn"
        :class="{ selected: selectedOption === opt }"
        @click="selectOption(opt)"
      >
        <span class="opt-badge">{{ ['A', 'B', 'C', 'D'][idx] }}</span>
        <span class="opt-text">{{ opt }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { sound } from '../lib/audio';
import { tts } from '../lib/tts';
import type { Word } from '../types';

const props = defineProps<{
  word: Word;
  options: string[];
  initialSelected?: string;
  autoSpeak?: boolean;
  speechRate?: number;
}>();

const emit = defineEmits<{
  (e: 'select', meaning: string): void;
}>();

const selectedOption = ref<string>(props.initialSelected || '');

function speakWord() {
  tts.speak(props.word.word, props.speechRate || 0.85);
}

function selectOption(opt: string) {
  sound.playTap();
  selectedOption.value = opt;
  emit('select', opt);
}

watch(
  () => props.word.id,
  () => {
    selectedOption.value = props.initialSelected || '';
    if (props.autoSpeak !== false) {
      setTimeout(speakWord, 300);
    }
  }
);

onMounted(() => {
  if (props.autoSpeak !== false) {
    setTimeout(speakWord, 400);
  }
});
</script>

<style scoped>
.choice-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.prompt-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
}

.target-word {
  font-family: var(--font-title);
  font-size: 38px;
  font-weight: 800;
  color: var(--color-primary-dark);
  margin: 6px 0;
  letter-spacing: 0.5px;
}

.meta-tags {
  display: flex;
  gap: 6px;
}

.tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag.pos {
  background: #e0f2fe;
  color: #0284c7;
}

.tag.cat {
  background: #fef3c7;
  color: #b45309;
}

.speak-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  color: #1d4ed8;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.speaker-icon {
  font-size: 28px;
}

.speak-text {
  font-size: 12px;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-md);
  padding: 16px 20px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  text-align: left;
}

.option-btn:hover {
  border-color: #93c5fd;
  background: #f8fafc;
}

.option-btn.selected {
  border-color: var(--color-primary);
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.opt-badge {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 16px;
  color: #475569;
  flex-shrink: 0;
}

.option-btn.selected .opt-badge {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.opt-text {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  flex: 1;
}
</style>
