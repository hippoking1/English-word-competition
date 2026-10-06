<template>
  <div class="spell-card">
    <!-- Top prompt area -->
    <div class="prompt-header">
      <div class="meaning-box">
        <span class="prompt-label">請拼出此單字：</span>
        <h2 class="target-meaning">{{ word.meaning }}</h2>
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

    <!-- Letter slots / Current typed text preview -->
    <div class="slots-container">
      <div class="letter-slots">
        <div
          v-for="(slot, idx) in slots"
          :key="idx"
          class="letter-box"
          :class="{
            filled: !!slot.char,
            special: slot.isSpecial,
            active: idx === currentText.length
          }"
        >
          {{ slot.char }}
        </div>
      </div>
      <div class="input-toggle">
        <button
          class="toggle-mode-btn"
          :class="{ active: inputMode === 'handwriting' }"
          @click="inputMode = 'handwriting'"
        >
          ✍️ 手寫輸入
        </button>
        <button
          class="toggle-mode-btn"
          :class="{ active: inputMode === 'keyboard' }"
          @click="inputMode = 'keyboard'"
        >
          ⌨️ 鍵盤輸入
        </button>
      </div>
    </div>

    <!-- Input area based on mode -->
    <div class="input-container">
      <WordPad
        v-if="inputMode === 'handwriting'"
        :initial-ink="initialInk"
        :initial-text="currentText"
        @change="handlePadChange"
        @clear="handlePadClear"
      />
      <OnScreenKeyboard
        v-else
        @char="handleKeyChar"
        @backspace="handleKeyBackspace"
        @space="handleKeySpace"
        @clear="handleKeyClear"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { tts } from '../lib/tts';
import type { Ink, Word } from '../types';
import OnScreenKeyboard from './OnScreenKeyboard.vue';
import WordPad from './WordPad.vue';

const props = defineProps<{
  word: Word;
  initialInk?: Ink;
  initialText?: string;
  autoSpeak?: boolean;
  speechRate?: number;
}>();

const emit = defineEmits<{
  (e: 'update', payload: { text: string; ink?: Ink; candidates?: string[] }): void;
}>();

const inputMode = ref<'handwriting' | 'keyboard'>('handwriting');
const currentText = ref<string>(props.initialText || '');
const currentInk = ref<Ink | undefined>(props.initialInk);
const currentCandidates = ref<string[]>([]);

// Generate letter guide slots based on word structure
const slots = computed(() => {
  const target = props.word.word;
  const result: Array<{ char: string; isSpecial: boolean }> = [];

  for (let i = 0; i < target.length; i++) {
    const expectedChar = target[i];
    const isSpecial = expectedChar === ' ' || expectedChar === '-' || expectedChar === "'";
    const entered = currentText.value[i] || '';

    result.push({
      char: isSpecial ? expectedChar : entered,
      isSpecial
    });
  }

  // If user typed longer than target, still show remaining chars
  if (currentText.value.length > target.length) {
    for (let i = target.length; i < currentText.value.length; i++) {
      result.push({
        char: currentText.value[i],
        isSpecial: false
      });
    }
  }

  return result;
});

function speakWord() {
  tts.speak(props.word.word, props.speechRate || 0.85);
}

function handlePadChange(payload: { ink: Ink; text: string; candidates: string[] }) {
  currentInk.value = payload.ink;
  currentText.value = payload.text;
  currentCandidates.value = payload.candidates;

  emit('update', {
    text: payload.text,
    ink: payload.ink,
    candidates: payload.candidates
  });
}

function handlePadClear() {
  currentInk.value = [];
  currentText.value = '';
  currentCandidates.value = [];
  emit('update', { text: '', ink: [] });
}

function handleKeyChar(char: string) {
  currentText.value += char;
  emit('update', { text: currentText.value });
}

function handleKeyBackspace() {
  if (currentText.value.length > 0) {
    currentText.value = currentText.value.slice(0, -1);
    emit('update', { text: currentText.value });
  }
}

function handleKeySpace() {
  currentText.value += ' ';
  emit('update', { text: currentText.value });
}

function handleKeyClear() {
  currentText.value = '';
  emit('update', { text: '' });
}

watch(
  () => props.word.id,
  () => {
    currentText.value = props.initialText || '';
    currentInk.value = props.initialInk;
    currentCandidates.value = [];
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
.spell-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.prompt-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
}

.target-meaning {
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
  margin: 4px 0;
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
  padding: 10px 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  color: #1d4ed8;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.speaker-icon {
  font-size: 26px;
}

.speak-text {
  font-size: 12px;
}

.slots-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.letter-slots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.letter-box {
  width: 36px;
  height: 44px;
  border-bottom: 3px solid #94a3b8;
  background: white;
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 24px;
  color: #0f172a;
  transition: all 0.2s;
}

.letter-box.filled {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary-dark);
}

.letter-box.active {
  border-bottom-color: #f59e0b;
  background: #fffbeb;
}

.letter-box.special {
  border-bottom: none;
  background: transparent;
  color: #64748b;
  width: 16px;
}

.input-toggle {
  display: flex;
  gap: 4px;
  background: #e2e8f0;
  padding: 3px;
  border-radius: var(--radius-sm);
}

.toggle-mode-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.toggle-mode-btn.active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.input-container {
  width: 100%;
}
</style>
