<template>
  <div class="app-root">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePlayerStore } from './stores/player';
import { useWordsStore } from './stores/words';

const wordsStore = useWordsStore();
const playerStore = usePlayerStore();

onMounted(async () => {
  await wordsStore.loadWords();
  await playerStore.loadPlayers();
});
</script>

<style>
@import './styles/base.css';

.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
