<template>
  <div class="progress-bar-container">
    <div class="dots-wrapper">
      <button
        v-for="(item, idx) in total"
        :key="idx"
        class="progress-dot"
        :class="{
          active: idx === current,
          answered: isAnswered(idx),
          unanswered: !isAnswered(idx) && idx < current
        }"
        @click="$emit('select', idx)"
      >
        {{ idx + 1 }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  total: number;
  current: number;
  answers: Record<string, any>;
  items: Array<{ key: string }>;
}>();

defineEmits<{
  (e: 'select', index: number): void;
}>();

function isAnswered(idx: number): boolean {
  const item = props.items[idx];
  if (!item) return false;
  const ans = props.answers[item.key];
  if (!ans) return false;
  return (
    (ans.userInk && ans.userInk.length > 0) ||
    (ans.userText && ans.userText.trim().length > 0) ||
    !!ans.choiceSelected
  );
}
</script>

<style scoped>
.progress-bar-container {
  width: 100%;
  overflow-x: auto;
  padding: 6px 4px;
}

.dots-wrapper {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: max-content;
}

.progress-dot {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e2e8f0;
  background: white;
  color: #64748b;
  transition: all 0.2s;
}

.progress-dot.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
}

.progress-dot.answered {
  border-color: #10b981;
  background: #ecfdf5;
  color: #059669;
}

.progress-dot.answered.active {
  border-color: #059669;
  background: #059669;
  color: white;
}

.progress-dot.unanswered {
  border-color: #fca5a5;
  background: #fff1f2;
  color: #e11d48;
}
</style>
