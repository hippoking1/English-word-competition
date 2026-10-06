<template>
  <div class="pinpad-container">
    <div class="pin-display">
      <div
        v-for="i in 4"
        :key="i"
        class="pin-circle"
        :class="{ filled: pin.length >= i }"
      ></div>
    </div>

    <div class="keypad-grid">
      <button
        v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
        :key="num"
        class="pad-num"
        @click="appendDigit(num)"
      >
        {{ num }}
      </button>

      <button class="pad-action" @click="$emit('cancel')">取消</button>
      <button class="pad-num" @click="appendDigit(0)">0</button>
      <button class="pad-action" @click="deleteDigit">⌫</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { sound } from '../lib/audio';

const emit = defineEmits<{
  (e: 'submit', pin: string): void;
  (e: 'cancel'): void;
}>();

const pin = ref('');

function appendDigit(d: number) {
  if (pin.value.length < 4) {
    sound.playTap();
    pin.value += String(d);
    if (pin.value.length === 4) {
      setTimeout(() => {
        emit('submit', pin.value);
        pin.value = '';
      }, 100);
    }
  }
}

function deleteDigit() {
  if (pin.value.length > 0) {
    sound.playTap();
    pin.value = pin.value.slice(0, -1);
  }
}
</script>

<style scoped>
.pinpad-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.pin-display {
  display: flex;
  gap: 14px;
}

.pin-circle {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid #94a3b8;
  transition: all 0.2s;
}

.pin-circle.filled {
  background: var(--color-primary);
  border-color: var(--color-primary);
  transform: scale(1.2);
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 260px;
}

.pad-num, .pad-action {
  height: 60px;
  border-radius: 999px;
  font-family: var(--font-title);
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #1e293b;
  box-shadow: 0 2px 0 #cbd5e1;
  cursor: pointer;
  transition: all 0.1s;
}

.pad-num:active, .pad-action:active {
  transform: translateY(2px);
  box-shadow: none;
}

.pad-action {
  font-size: 16px;
  color: #64748b;
  background: transparent;
  box-shadow: none;
}
</style>
