import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getLocalFamiliarity, saveLocalFamiliarity } from '../lib/db';
import type { Familiarity, WordFamiliarityRecord } from '../types';
import { usePlayerStore } from './player';

export const useFlashcardStore = defineStore('flashcard', () => {
  const records = ref<Record<string, WordFamiliarityRecord>>({});
  const loaded = ref<boolean>(false);

  const stats = computed(() => {
    let mastered = 0;
    let learning = 0;
    let unfamiliar = 0;
    for (const r of Object.values(records.value)) {
      if (r.level === 2) mastered++;
      else if (r.level === 1) learning++;
      else unfamiliar++;
    }
    return { mastered, learning, unfamiliar, totalTested: Object.keys(records.value).length };
  });

  async function loadRecords() {
    const pStore = usePlayerStore();
    const pid = pStore.currentPlayer?.id || 'guest';
    records.value = await getLocalFamiliarity(pid);
    loaded.value = true;
  }

  async function setLevel(wordId: string, level: Familiarity) {
    const pStore = usePlayerStore();
    const pid = pStore.currentPlayer?.id || 'guest';
    const existing = records.value[wordId] || {
      playerId: pid,
      wordId,
      level: 0,
      wrongCount: 0,
      correctStreak: 0,
      lastTestedAt: new Date().toISOString()
    };

    records.value[wordId] = {
      ...existing,
      level,
      lastTestedAt: new Date().toISOString()
    };

    await saveLocalFamiliarity(pid, records.value);
  }

  async function recordResult(wordId: string, isCorrect: boolean) {
    const pStore = usePlayerStore();
    const pid = pStore.currentPlayer?.id || 'guest';
    const existing = records.value[wordId] || {
      playerId: pid,
      wordId,
      level: 0,
      wrongCount: 0,
      correctStreak: 0,
      lastTestedAt: new Date().toISOString()
    };

    if (isCorrect) {
      existing.correctStreak++;
      if (existing.correctStreak >= 3) {
        existing.level = 2; // Mastered
      } else if (existing.correctStreak >= 1) {
        existing.level = Math.max(existing.level, 1) as Familiarity;
      }
    } else {
      existing.correctStreak = 0;
      existing.wrongCount++;
      existing.level = 0; // Back to unfamiliar
    }

    existing.lastTestedAt = new Date().toISOString();
    records.value[wordId] = existing;
    await saveLocalFamiliarity(pid, records.value);
  }

  function getLevel(wordId: string): Familiarity {
    return records.value[wordId]?.level ?? 0;
  }

  function getUnfamiliarWordIds(): string[] {
    return Object.entries(records.value)
      .filter(([_, rec]) => rec.level === 0 || rec.wrongCount > 0)
      .map(([id]) => id);
  }

  return {
    records,
    loaded,
    stats,
    loadRecords,
    setLevel,
    recordResult,
    getLevel,
    getUnfamiliarWordIds
  };
});
