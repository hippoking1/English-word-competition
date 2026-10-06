<template>
  <div class="countdown-badge" :class="{ urgent: isUrgent, untimed: seconds === 0 }">
    <span class="timer-icon">⏱️</span>
    <span class="timer-text">{{ displayTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  seconds: number;
}>();

const isUrgent = computed(() => props.seconds > 0 && props.seconds <= 60);

const displayTime = computed(() => {
  if (props.seconds <= 0) return '無時限';
  const mins = Math.floor(props.seconds / 60);
  const secs = props.seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});
</script>

<style scoped>
.countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
  color: #334155;
  transition: all 0.3s ease;
}

.countdown-badge.urgent {
  background: #fee2e2;
  border-color: #f87171;
  color: #dc2626;
  animation: pulse 1s infinite alternate;
}

.countdown-badge.untimed {
  color: #64748b;
  font-size: 13px;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.04); }
}
</style>
