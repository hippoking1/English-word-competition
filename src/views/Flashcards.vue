<template>
  <div class="flashcards-page">
    <!-- Top header -->
    <header class="fc-header">
      <button class="back-btn" @click="$router.push('/home')">◀ 返回首頁</button>
      <h2 class="fc-title">🎴 單字閃卡學習</h2>
      <div class="counter-badge">
        {{ currentIndex + 1 }} / {{ filteredWords.length }}
      </div>
    </header>

    <!-- Filters toolbar -->
    <div class="filters-bar">
      <div class="filter-item">
        <label>範圍：</label>
        <select v-model="selectedRange" @change="currentIndex = 0">
          <option value="all">全題庫 (1~400)</option>
          <option value="unfamiliar">💪 只看不熟的單字 ({{ unfamiliarCount }})</option>
          <option value="r1">第 1 ~ 100 號</option>
          <option value="r2">第 101 ~ 200 號</option>
          <option value="r3">第 201 ~ 300 號</option>
          <option value="r4">第 301 ~ 400 號</option>
        </select>
      </div>

      <div class="filter-item">
        <button class="switch-side-btn" @click="frontSide = frontSide === 'en' ? 'zh' : 'en'">
          🔄 正面：{{ frontSide === 'en' ? '英文單字' : '中文意思' }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div class="empty-state" v-if="filteredWords.length === 0">
      <p>目前所選範圍沒有單字！</p>
      <button class="reset-btn" @click="selectedRange = 'all'">切換為全題庫</button>
    </div>

    <!-- Main Flashcard Area -->
    <main class="card-area" v-else-if="currentWord">
      <div
        class="flashcard-3d"
        :class="{ flipped: isFlipped }"
        @click="flipCard"
      >
        <!-- Front side -->
        <div class="card-face front">
          <span class="word-no">#{{ currentWord.no }}</span>
          <div class="face-content">
            <template v-if="frontSide === 'en'">
              <h1 class="main-text">{{ currentWord.word }}</h1>
              <button class="speak-btn" @click.stop="speakCurrent">🔊 聽發音</button>
            </template>
            <template v-else>
              <h1 class="main-text">{{ currentWord.meaning }}</h1>
              <span class="tap-hint">點擊翻面查看英文</span>
            </template>
          </div>
          <div class="card-status-badge" :class="currentLevelClass">
            {{ currentLevelText }}
          </div>
        </div>

        <!-- Back side -->
        <div class="card-face back">
          <span class="word-no">#{{ currentWord.no }}</span>
          <div class="face-content">
            <template v-if="frontSide === 'en'">
              <h1 class="main-text">{{ currentWord.meaning }}</h1>
              <div class="tags-row">
                <span class="tag" v-if="currentWord.pos">{{ currentWord.pos }}</span>
                <span class="tag" v-if="currentWord.category">{{ currentWord.category }}</span>
              </div>
            </template>
            <template v-else>
              <h1 class="main-text">{{ currentWord.word }}</h1>
              <button class="speak-btn" @click.stop="speakCurrent">🔊 聽發音</button>
            </template>
          </div>
          <div class="card-status-badge" :class="currentLevelClass">
            {{ currentLevelText }}
          </div>
        </div>
      </div>

      <!-- Familiarity Rating Buttons -->
      <div class="rating-bar">
        <button class="rate-btn red" @click="setWordLevel(0)">
          🔴 還不熟
        </button>
        <button class="rate-btn yellow" @click="setWordLevel(1)">
          🟡 學習中
        </button>
        <button class="rate-btn green" @click="setWordLevel(2)">
          🟢 已精熟
        </button>
      </div>

      <!-- Navigation arrows -->
      <div class="nav-controls">
        <button class="arrow-btn" :disabled="currentIndex === 0" @click="prevCard">
          ◀ 上一張
        </button>
        <button class="arrow-btn" :disabled="currentIndex >= filteredWords.length - 1" @click="nextCard">
          下一張 ▶
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { sound } from '../lib/audio';
import { tts } from '../lib/tts';
import { useFlashcardStore } from '../stores/flashcard';
import { useWordsStore } from '../stores/words';
import type { Familiarity, Word } from '../types';

const wordsStore = useWordsStore();
const flashcardStore = useFlashcardStore();

const currentIndex = ref(0);
const isFlipped = ref(false);
const frontSide = ref<'en' | 'zh'>('en');
const selectedRange = ref('all');

const filteredWords = computed<Word[]>(() => {
  const pool = wordsStore.activeWords;
  if (selectedRange.value === 'unfamiliar') {
    const unFamIds = new Set(flashcardStore.getUnfamiliarWordIds());
    return pool.filter(w => unFamIds.has(w.id));
  } else if (selectedRange.value === 'r1') {
    return pool.filter(w => w.no >= 1 && w.no <= 100);
  } else if (selectedRange.value === 'r2') {
    return pool.filter(w => w.no >= 101 && w.no <= 200);
  } else if (selectedRange.value === 'r3') {
    return pool.filter(w => w.no >= 201 && w.no <= 300);
  } else if (selectedRange.value === 'r4') {
    return pool.filter(w => w.no >= 301 && w.no <= 400);
  }
  return pool;
});

const unfamiliarCount = computed(() => {
  return flashcardStore.getUnfamiliarWordIds().length;
});

const currentWord = computed<Word | null>(() => {
  return filteredWords.value[currentIndex.value] || null;
});

const currentLevel = computed<Familiarity>(() => {
  if (!currentWord.value) return 0;
  return flashcardStore.getLevel(currentWord.value.id);
});

const currentLevelText = computed(() => {
  if (currentLevel.value === 2) return '🌟 已精熟';
  if (currentLevel.value === 1) return '📖 學習中';
  return '💪 待加強';
});

const currentLevelClass = computed(() => {
  if (currentLevel.value === 2) return 'level-green';
  if (currentLevel.value === 1) return 'level-yellow';
  return 'level-red';
});

function flipCard() {
  sound.playTap();
  isFlipped.value = !isFlipped.value;
}

function speakCurrent() {
  if (currentWord.value) {
    tts.speak(currentWord.value.word);
  }
}

async function setWordLevel(lvl: Familiarity) {
  if (!currentWord.value) return;
  sound.playTap();
  await flashcardStore.setLevel(currentWord.value.id, lvl);
  nextCard();
}

function nextCard() {
  if (currentIndex.value < filteredWords.value.length - 1) {
    isFlipped.value = false;
    currentIndex.value++;
    autoSpeakIfFrontEn();
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    isFlipped.value = false;
    currentIndex.value--;
    autoSpeakIfFrontEn();
  }
}

function autoSpeakIfFrontEn() {
  if (frontSide.value === 'en' && currentWord.value) {
    setTimeout(() => {
      tts.speak(currentWord.value!.word);
    }, 200);
  }
}

watch(currentIndex, () => {
  isFlipped.value = false;
});

onMounted(async () => {
  await wordsStore.loadWords();
  await flashcardStore.loadRecords();
  autoSpeakIfFrontEn();
});
</script>

<style scoped>
.flashcards-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
  padding: 16px 20px 40px;
}

.fc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 600px;
  width: 100%;
  margin: 0 auto 12px;
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

.fc-title {
  font-family: var(--font-title);
  font-size: 22px;
  color: #1e3a8a;
}

.counter-badge {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 15px;
  color: #64748b;
  background: white;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 600px;
  width: 100%;
  margin: 0 auto 20px;
  background: white;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  gap: 10px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.filter-item select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 13px;
  font-weight: 700;
}

.switch-side-btn {
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.card-area {
  max-width: 520px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  perspective: 1000px;
}

.flashcard-3d {
  width: 100%;
  height: 280px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.flashcard-3d.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background: white;
  border-radius: var(--radius-lg);
  border: 2px solid #e2e8f0;
  box-shadow: var(--shadow-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-align: center;
}

.card-face.back {
  transform: rotateY(180deg);
  background: #f8fafc;
  border-color: #cbd5e1;
}

.word-no {
  align-self: flex-start;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 14px;
  color: #94a3b8;
}

.face-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.main-text {
  font-family: var(--font-title);
  font-size: 40px;
  font-weight: 800;
  color: var(--color-primary-dark);
}

.tap-hint {
  font-size: 13px;
  color: #94a3b8;
}

.speak-btn {
  padding: 6px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}

.card-status-badge {
  align-self: flex-end;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
}

.card-status-badge.level-green {
  background: #ecfdf5;
  color: #059669;
}
.card-status-badge.level-yellow {
  background: #fef3c7;
  color: #b45309;
}
.card-status-badge.level-red {
  background: #fee2e2;
  color: #dc2626;
}

.rating-bar {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.rate-btn {
  flex: 1;
  padding: 12px 0;
  border-radius: var(--radius-md);
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.rate-btn.red {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
.rate-btn.yellow {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}
.rate-btn.green {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.rate-btn:hover {
  transform: translateY(-2px);
}

.nav-controls {
  display: flex;
  justify-content: space-between;
}

.arrow-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-weight: 700;
  color: #475569;
}

.arrow-btn:disabled {
  opacity: 0.3;
}

.tags-row {
  display: flex;
  gap: 6px;
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  background: #e2e8f0;
  border-radius: 4px;
}
</style>
