<template>
  <div class="mascot-avatar" :style="{ width: `${size || 48}px`, height: `${size || 48}px` }">
    <span class="avatar-emoji">{{ emoji }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  avatar?: string;
  size?: number;
}>();

const emojiMap: Record<string, string> = {
  owl: '🦉',
  fox: '🦊',
  bear: '🐻',
  rabbit: '🐰',
  lion: '🦁',
  penguin: '🐧'
};

const emoji = computed(() => {
  return emojiMap[props.avatar || 'owl'] || '🦉';
});
</script>

<style scoped>
.mascot-avatar {
  border-radius: 9999px;
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border: 2px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.avatar-emoji {
  font-size: 60%;
  line-height: 1;
}
</style>
