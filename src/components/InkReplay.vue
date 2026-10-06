<template>
  <div class="ink-replay-card">
    <svg
      :viewBox="viewBox"
      class="ink-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Optional four lines guide -->
      <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#fca5a5" stroke-width="0.8" stroke-dasharray="2 2" />
      <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="4 3" />
      <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#93c5fd" stroke-width="1.2" />

      <!-- Drawn strokes -->
      <path
        v-for="(pathStr, idx) in pathStrings"
        :key="idx"
        :d="pathStr"
        fill="none"
        stroke="#1e293b"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { strokeToSvgPath } from '../lib/ink';
import type { Ink } from '../types';

const props = defineProps<{
  ink?: Ink;
  width?: number;
  height?: number;
}>();

const viewBox = computed(() => {
  return `0 0 ${props.width || 360} ${props.height || 140}`;
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
  border: 1px solid #e2e8f0;
}

.ink-svg {
  width: 100%;
  height: 100%;
  max-height: 160px;
}
</style>
