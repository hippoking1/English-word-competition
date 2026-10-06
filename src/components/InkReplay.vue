<template>
  <div class="ink-replay-card">
    <svg
      :viewBox="viewBox"
      class="ink-svg"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Adaptive English four-line guide based on ink bounds -->
      <line
        :x1="bounds.minX"
        :y1="bounds.minY + bounds.height * 0.25"
        :x2="bounds.minX + bounds.width"
        :y2="bounds.minY + bounds.height * 0.25"
        stroke="#fca5a5"
        stroke-width="1"
        stroke-dasharray="3 3"
      />
      <line
        :x1="bounds.minX"
        :y1="bounds.minY + bounds.height * 0.5"
        :x2="bounds.minX + bounds.width"
        :y2="bounds.minY + bounds.height * 0.5"
        stroke="#94a3b8"
        stroke-width="1"
        stroke-dasharray="4 3"
      />
      <line
        :x1="bounds.minX"
        :y1="bounds.minY + bounds.height * 0.75"
        :x2="bounds.minX + bounds.width"
        :y2="bounds.minY + bounds.height * 0.75"
        stroke="#93c5fd"
        stroke-width="1.4"
      />

      <!-- Drawn strokes -->
      <path
        v-for="(pathStr, idx) in pathStrings"
        :key="idx"
        :d="pathStr"
        fill="none"
        stroke="#0f172a"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getInkBounds, strokeToSvgPath } from '../lib/ink';
import type { Ink } from '../types';

const props = defineProps<{
  ink?: Ink;
  width?: number;
  height?: number;
}>();

const bounds = computed(() => {
  if (!props.ink || props.ink.length === 0) {
    return { minX: 0, minY: 0, width: props.width || 360, height: props.height || 140 };
  }

  const b = getInkBounds(props.ink);
  // Add comfortable padding around ink so strokes don't touch edges
  const padX = Math.max(16, b.width * 0.08);
  const padY = Math.max(16, b.height * 0.15);

  const minX = b.minX - padX;
  const minY = b.minY - padY;
  const width = Math.max(120, b.width + padX * 2);
  const height = Math.max(70, b.height + padY * 2);

  return { minX, minY, width, height };
});

const viewBox = computed(() => {
  return `${bounds.value.minX} ${bounds.value.minY} ${bounds.value.width} ${bounds.value.height}`;
});

const pathStrings = computed(() => {
  if (!props.ink || props.ink.length === 0) return [];
  return props.ink.map(stroke => strokeToSvgPath(stroke));
});
</script>

<style scoped>
.ink-replay-card {
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.ink-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
