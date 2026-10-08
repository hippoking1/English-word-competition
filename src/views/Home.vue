<template>
  <div class="home-page">
    <!-- Top Navbar -->
    <header class="navbar">
      <div class="user-badge" @click="$router.push('/profiles')">
        <Mascot :avatar="playerStore.currentPlayer?.avatar" :size="40" />
        <div class="user-info">
          <span class="user-greeting">選手：</span>
          <span class="user-name">{{ playerStore.currentPlayer?.nickname || '訪客' }} ▾</span>
        </div>
      </div>

      <div class="nav-right">
        <button class="nav-btn" @click="$router.push('/history')" title="測驗紀錄">
          📊 歷史紀錄
        </button>
        <button class="nav-btn" @click="$router.push('/parent')" title="家長設定">
          ⚙️ 家長專區
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Title & Bank Selector -->
      <section class="banner-section">
        <h1 class="main-title">國小英語單字王</h1>
        <p class="main-desc">宜蘭縣 113 學年度 Easy Go 400 單 競賽模擬系統</p>

        <div class="bank-selector">
          <label class="bank-label">選擇練習題庫：</label>
          <select :value="wordsStore.currentBank" @change="onBankChange($event)">
            <option v-for="b in wordsStore.banks" :key="b.id" :value="b.id">
              {{ b.name }} (共 {{ b.count }} 字)
            </option>
          </select>
        </div>
      </section>

      <!-- Mastery Stats Pill -->
      <section class="stats-bar">
        <div class="stat-pill mastered">
          <span class="stat-num">{{ flashcardStore.stats.mastered }}</span>
          <span class="stat-text">🌟 已精熟單字</span>
        </div>
        <div class="stat-pill learning">
          <span class="stat-num">{{ flashcardStore.stats.learning }}</span>
          <span class="stat-text">📖 學習中</span>
        </div>
        <div class="stat-pill unfamiliar">
          <span class="stat-num">{{ flashcardStore.stats.unfamiliar }}</span>
          <span class="stat-text">💪 待加強</span>
        </div>
      </section>

      <!-- Mode Cards Grid -->
      <section class="modes-grid">
        <!-- 1. Official Simulation -->
        <div class="mode-card official" @click="startOfficial">
          <div class="mode-header">
            <span class="mode-icon">🥇</span>
            <span class="mode-tag">正式賽制</span>
          </div>
          <h2 class="mode-title">正式模擬測驗</h2>
          <p class="mode-desc">
            標準 30 題混合測驗 (中翻英手寫/鍵盤拼字 + 英翻中四選一)，倒數計時，時間到自動交卷。
          </p>
          <button class="mode-btn">開始挑戰</button>
        </div>

        <!-- 2. Daily Mini Challenge -->
        <div class="mode-card mini" @click="startMini">
          <div class="mode-header">
            <span class="mode-icon">⚡</span>
            <span class="mode-tag">每日任務</span>
          </div>
          <h2 class="mode-title">每日迷你挑戰</h2>
          <p class="mode-desc">
            今日專屬 10 題快測，限時 3 分鐘！每天練習維持手感與記憶。
          </p>
          <button class="mode-btn">立刻測驗</button>
        </div>

        <!-- 3. Flashcards -->
        <div class="mode-card flashcard" @click="$router.push('/flashcards')">
          <div class="mode-header">
            <span class="mode-icon">🎴</span>
            <span class="mode-tag">學習神器</span>
          </div>
          <h2 class="mode-title">單字閃卡學習</h2>
          <p class="mode-desc">
            逐字聽道地美式發音、翻牌看中文，標記熟悉度自主刷題！
          </p>
          <button class="mode-btn">進入學習</button>
        </div>

        <!-- 4. Practice Mode -->
        <div class="mode-card practice" @click="showPracticeModal = true">
          <div class="mode-header">
            <span class="mode-icon">🎯</span>
            <span class="mode-tag">自訂範圍</span>
          </div>
          <h2 class="mode-title">自由練習模式</h2>
          <p class="mode-desc">
            可自選題數、自訂編號範圍 (例如 1~100) 或「專攻不熟單字」，無時限即時看答案。
          </p>
          <button class="mode-btn">自訂題型</button>
        </div>
      </section>
    </main>

    <!-- Custom Practice Modal -->
    <div class="modal-overlay" v-if="showPracticeModal">
      <div class="modal-content">
        <h3>自訂練習模式</h3>
        <div class="form-item">
          <label>練習題數：</label>
          <div class="radio-group">
            <button
              v-for="c in [10, 20, 30, 50]"
              :key="c"
              class="radio-btn"
              :class="{ active: practiceCount === c }"
              @click="practiceCount = c"
            >
              {{ c }} 題
            </button>
            <button
              class="radio-btn"
              :class="{ active: practiceCount === 999 }"
              @click="practiceCount = 999"
              title="測驗所選範圍內全部單字"
            >
              全部
            </button>
          </div>
        </div>

        <div class="form-item">
          <label>出題範圍：</label>
          <select v-model="practiceScope">
            <option value="all">全題庫隨機</option>
            <option value="unfamiliar">💪 只出我還不熟/答錯的單字</option>
            <option value="r1">第 1 ~ 100 號</option>
            <option value="r2">第 101 ~ 200 號</option>
            <option value="r3">第 201 ~ 300 號</option>
            <option value="r4">第 301 ~ 400 號</option>
            <option value="custom">✏️ 自由自訂範圍 (任意自選區間)</option>
          </select>
        </div>

        <!-- Custom Range Control Panel -->
        <div class="custom-range-panel" v-if="practiceScope === 'custom'">
          <div class="custom-range-header">
            <span class="range-panel-title">自訂編號區間</span>
            <span class="range-count-badge" :class="{ empty: matchedWordsCount === 0 }">
              {{ matchedWordsCount > 0 ? `共 ${matchedWordsCount} 個單字` : '無符合單字' }}
            </span>
          </div>

          <!-- Quick number range inputs -->
          <div class="range-inputs-row">
            <span>從第</span>
            <input
              type="number"
              v-model.number="customRangeStart"
              min="1"
              :max="maxWordNo"
              class="range-num-input"
              @input="onRangeNumChange"
            />
            <span>號 至 第</span>
            <input
              type="number"
              v-model.number="customRangeEnd"
              min="1"
              :max="maxWordNo"
              class="range-num-input"
              @input="onRangeNumChange"
            />
            <span>號</span>
          </div>

          <!-- Quick range preset buttons -->
          <div class="preset-chips">
            <button
              type="button"
              class="preset-chip"
              v-for="p in [
                { label: '1~50', s: 1, e: 50 },
                { label: '51~100', s: 51, e: 100 },
                { label: '101~150', s: 101, e: 150 },
                { label: '151~200', s: 151, e: 200 },
                { label: '201~300', s: 201, e: 300 },
                { label: '301~400', s: 301, e: 400 }
              ]"
              :key="p.label"
              @click="applyPreset(p.s, p.e)"
            >
              {{ p.label }}
            </button>
          </div>

          <!-- Advanced multi-range / flexible text input -->
          <div class="range-advanced-row">
            <label class="adv-label">自由輸入號碼或多區間（例如：1-50 或 1-30, 51-80, 95）：</label>
            <input
              type="text"
              v-model="customRangeText"
              class="range-text-input"
              placeholder="例如：1-50 或 1-30, 51-80"
              @input="onRangeTextChange"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showPracticeModal = false">取消</button>
          <button class="btn-confirm" @click="startCustomPractice">開始練習</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Mascot from '../components/Mascot.vue';
import { useExamStore } from '../stores/exam';
import { useFlashcardStore } from '../stores/flashcard';
import { usePlayerStore } from '../stores/player';
import { useWordsStore } from '../stores/words';

const router = useRouter();
const playerStore = usePlayerStore();
const wordsStore = useWordsStore();
const flashcardStore = useFlashcardStore();
const examStore = useExamStore();

const showPracticeModal = ref(false);
const practiceCount = ref(20);
const practiceScope = ref('all');

const customRangeStart = ref(1);
const customRangeEnd = ref(50);
const customRangeText = ref('1-50');

const maxWordNo = computed(() => {
  if (wordsStore.activeWords.length === 0) return 400;
  return Math.max(...wordsStore.activeWords.map(w => w.no), 400);
});

function parseRangeString(str: string): number[] {
  const result = new Set<number>();
  if (!str) return [];
  const parts = str.split(/[,，;；\s/]+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const rangeMatch = trimmed.match(/^(\d+)[-~～.]+(\d+)$/);
    if (rangeMatch) {
      const s = parseInt(rangeMatch[1], 10);
      const e = parseInt(rangeMatch[2], 10);
      const min = Math.min(s, e);
      const max = Math.max(s, e);
      for (let i = min; i <= max; i++) {
        result.add(i);
      }
    } else {
      const single = parseInt(trimmed, 10);
      if (!isNaN(single) && single > 0) {
        result.add(single);
      }
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

const parsedCustomNos = computed(() => {
  return parseRangeString(customRangeText.value);
});

const matchedWordsCount = computed(() => {
  if (practiceScope.value !== 'custom') {
    return wordsStore.activeWords.length;
  }
  if (parsedCustomNos.value.length === 0) return 0;
  const set = new Set(parsedCustomNos.value);
  return wordsStore.activeWords.filter(w => set.has(w.no)).length;
});

function onRangeNumChange() {
  const s = customRangeStart.value;
  const e = customRangeEnd.value;
  if (s > 0 && e > 0) {
    customRangeText.value = `${s}-${e}`;
  }
}

function onRangeTextChange() {
  const match = customRangeText.value.trim().match(/^(\d+)[-~～]+(\d+)$/);
  if (match) {
    customRangeStart.value = parseInt(match[1], 10);
    customRangeEnd.value = parseInt(match[2], 10);
  }
}

function applyPreset(s: number, e: number) {
  customRangeStart.value = s;
  customRangeEnd.value = e;
  customRangeText.value = `${s}-${e}`;
}

function onBankChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  wordsStore.setBank(target.value);
}

async function startOfficial() {
  await examStore.startExam('official', { bank: wordsStore.currentBank });
  router.push('/exam');
}

async function startMini() {
  await examStore.startExam('mini', { bank: wordsStore.currentBank });
  router.push('/exam');
}

async function startCustomPractice() {
  let rangeStart = 1;
  let rangeEnd = 400;
  let customNos: number[] | undefined = undefined;

  if (practiceScope.value === 'r1') { rangeStart = 1; rangeEnd = 100; }
  else if (practiceScope.value === 'r2') { rangeStart = 101; rangeEnd = 200; }
  else if (practiceScope.value === 'r3') { rangeStart = 201; rangeEnd = 300; }
  else if (practiceScope.value === 'r4') { rangeStart = 301; rangeEnd = 400; }
  else if (practiceScope.value === 'custom') {
    customNos = parsedCustomNos.value;
    if (customNos.length === 0) {
      alert('請先輸入或選擇有效的自訂出題範圍！');
      return;
    }
    const matched = wordsStore.activeWords.filter(w => customNos!.includes(w.no));
    if (matched.length === 0) {
      alert('在目前選定題庫中，找不到符合此自訂範圍的單字，請重新設定！');
      return;
    }
    rangeStart = customNos[0];
    rangeEnd = customNos[customNos.length - 1];
  }

  showPracticeModal.value = false;

  const mode = practiceScope.value === 'unfamiliar'
    ? 'unfamiliar'
    : (practiceScope.value.startsWith('r') || practiceScope.value === 'custom')
      ? 'range'
      : 'practice';

  await examStore.startExam(mode, {
    count: practiceCount.value,
    bank: wordsStore.currentBank,
    rangeStart,
    rangeEnd,
    customNos
  });

  router.push('/exam');
}

onMounted(async () => {
  await playerStore.loadPlayers();
  await wordsStore.loadWords();
  await flashcardStore.loadRecords();
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-main);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-greeting {
  font-size: 11px;
  color: var(--text-muted);
}

.user-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-primary-dark);
}

.nav-right {
  display: flex;
  gap: 10px;
}

.nav-btn {
  padding: 8px 14px;
  background: #f1f5f9;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #e2e8f0;
}

.main-content {
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.banner-section {
  text-align: center;
}

.main-title {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: 800;
  color: #1e3a8a;
  letter-spacing: -0.5px;
}

.main-desc {
  color: var(--text-muted);
  font-size: 15px;
  margin-top: 4px;
}

.bank-selector {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  background: white;
  padding: 6px 16px;
  border-radius: var(--radius-full);
  border: 1px solid #cbd5e1;
  box-shadow: var(--shadow-sm);
}

.bank-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.bank-selector select {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary-dark);
  cursor: pointer;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: var(--radius-full);
  font-weight: 800;
  font-size: 14px;
  box-shadow: var(--shadow-sm);
}

.stat-pill.mastered {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.stat-pill.learning {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.stat-pill.unfamiliar {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.stat-num {
  font-size: 18px;
  font-family: var(--font-title);
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.mode-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s ease;
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.mode-card.official { border-color: #93c5fd; }
.mode-card.mini { border-color: #fde047; }
.mode-card.flashcard { border-color: #a7f3d0; }
.mode-card.practice { border-color: #fed7aa; }

.mode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mode-icon {
  font-size: 32px;
}

.mode-tag {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
}

.mode-title {
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.mode-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
  flex: 1;
  margin-bottom: 18px;
}

.mode-btn {
  width: 100%;
  padding: 10px 0;
  border-radius: var(--radius-sm);
  background: #f1f5f9;
  color: #1e293b;
  font-weight: 800;
  font-size: 15px;
  transition: all 0.2s;
}

.mode-card:hover .mode-btn {
  background: var(--color-primary);
  color: white;
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
  max-width: 440px;
  width: 100%;
  box-shadow: var(--shadow-xl);
}

.form-item {
  margin-top: 16px;
}

.form-item label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 8px;
}

.radio-group {
  display: flex;
  gap: 8px;
}

.radio-btn {
  flex: 1;
  padding: 8px 0;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-weight: 700;
  color: #475569;
}

.radio-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.form-item select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
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

.custom-range-panel {
  margin-top: 14px;
  padding: 14px;
  background: #f8fafc;
  border-radius: var(--radius-sm);
  border: 1px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-range-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.range-panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.range-count-badge {
  font-size: 12px;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.range-count-badge.empty {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.range-inputs-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  flex-wrap: wrap;
}

.range-num-input {
  width: 72px;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 800;
  text-align: center;
  background: white;
  color: var(--color-primary-dark);
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-chip {
  padding: 4px 9px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}

.range-advanced-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.adv-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.range-text-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  background: white;
}
</style>
