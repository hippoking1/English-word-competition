<template>
  <div class="virtual-keyboard">
    <div class="keyboard-row" v-for="(row, rIdx) in rows" :key="rIdx">
      <button
        v-for="k in row"
        :key="k"
        class="key-btn"
        :class="{
          wide: k === 'Shift' || k === 'Backspace',
          space: k === 'Space',
          active: k === 'Shift' && isShiftActive
        }"
        @click="handleKeyPress(k)"
      >
        <span v-if="k === 'Shift'">{{ isShiftActive ? '⬆️ 大寫' : '⬆️ 小寫' }}</span>
        <span v-else-if="k === 'Backspace'">⌫ 刪除</span>
        <span v-else-if="k === 'Space'">空白鍵 (Space)</span>
        <span v-else>{{ getKeyDisplay(k) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { sound } from '../lib/audio';

const emit = defineEmits<{
  (e: 'char', char: string): void;
  (e: 'backspace'): void;
  (e: 'space'): void;
  (e: 'clear'): void;
}>();

const isShiftActive = ref(false);

const rows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', "'", 'Backspace'],
  ['-', 'Space']
];

function getKeyDisplay(k: string): string {
  if (k.length === 1 && /[a-z]/.test(k)) {
    return isShiftActive.value ? k.toUpperCase() : k.toLowerCase();
  }
  return k;
}

function handleKeyPress(k: string) {
  sound.playTap();
  if (k === 'Shift') {
    isShiftActive.value = !isShiftActive.value;
  } else if (k === 'Backspace') {
    emit('backspace');
  } else if (k === 'Space') {
    emit('space');
  } else {
    const char = isShiftActive.value ? k.toUpperCase() : k;
    emit('char', char);
  }
}
</script>

<style scoped>
.virtual-keyboard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  background: #e2e8f0;
  padding: 8px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.key-btn {
  flex: 1;
  min-width: 32px;
  height: 48px;
  background: white;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 2px 0 #cbd5e1;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 18px;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s;
}

.key-btn:active {
  transform: translateY(2px);
  box-shadow: none;
}

.key-btn.wide {
  flex: 1.5;
  font-size: 14px;
  background: #f8fafc;
}

.key-btn.space {
  flex: 4;
  font-size: 14px;
}

.key-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary-dark);
}
</style>
