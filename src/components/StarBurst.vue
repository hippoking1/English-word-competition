<template>
  <div class="starburst-container"></div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti';
import { onMounted } from 'vue';

const props = defineProps<{
  score?: number;
}>();

onMounted(() => {
  const count = props.score && props.score >= 90 ? 120 : 60;
  confetti({
    particleCount: count,
    spread: 70,
    origin: { y: 0.6 }
  });
});
</script>

<style scoped>
.starburst-container {
  pointer-events: none;
  position: absolute;
}
</style>
