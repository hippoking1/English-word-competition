import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { fetchWordsFromCloud } from '../lib/api';
import { getLocalWords, saveLocalWords } from '../lib/db';
import type { Word } from '../types';

export const useWordsStore = defineStore('words', () => {
  const words = ref<Word[]>([]);
  const version = ref<string>(localStorage.getItem('ewc_words_version') || '1.0');
  const loaded = ref<boolean>(false);
  const currentBank = ref<string>(localStorage.getItem('ewc_selected_bank') || 'yilan113');

  const banks = computed(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const w of words.value) {
      if (!w.enabled) continue;
      const bId = w.bank || 'yilan113';
      if (!map.has(bId)) {
        let name = bId;
        if (bId === 'yilan113') name = '宜蘭縣 113 學年度 400 單 (修訂版)';
        map.set(bId, { id: bId, name, count: 0 });
      }
      map.get(bId)!.count++;
    }
    return Array.from(map.values());
  });

  const activeWords = computed(() => {
    if (currentBank.value === 'all') {
      return words.value.filter(w => w.enabled);
    }
    return words.value.filter(w => w.enabled && w.bank === currentBank.value);
  });

  async function loadWords() {
    // 1. Local IndexedDB Cache
    const cached = await getLocalWords();
    if (cached && cached.length > 0) {
      words.value = cached;
      loaded.value = true;
    }

    // 2. Background check cloud Google Apps Script
    try {
      const cloudRes = await fetchWordsFromCloud(version.value);
      if (cloudRes && cloudRes.words && cloudRes.words.length > 0) {
        words.value = cloudRes.words;
        version.value = cloudRes.version || String(Date.now());
        localStorage.setItem('ewc_words_version', version.value);
        await saveLocalWords(words.value);
        loaded.value = true;
        return;
      }
    } catch (err) {
      console.warn('Could not refresh words from cloud:', err);
    }

    // 3. Fallback to bundled public/words.json
    if (words.value.length === 0) {
      try {
        const res = await fetch('./words.json');
        if (res.ok) {
          const list: Word[] = await res.json();
          words.value = list;
          await saveLocalWords(list);
          loaded.value = true;
        }
      } catch (err) {
        console.error('Failed to load bundled words.json:', err);
      }
    }
  }

  async function syncWordsFromCloud(force = false): Promise<{ ok: boolean; count: number; message: string }> {
    try {
      const cloudRes = await fetchWordsFromCloud(force ? undefined : version.value);
      if (cloudRes && cloudRes.notModified) {
        return { ok: true, count: words.value.length, message: '雲端題庫已是最新版本，無需更新。' };
      }
      if (cloudRes && cloudRes.words && cloudRes.words.length > 0) {
        words.value = cloudRes.words;
        version.value = cloudRes.version || String(Date.now());
        localStorage.setItem('ewc_words_version', version.value);
        await saveLocalWords(words.value);
        loaded.value = true;
        return { ok: true, count: cloudRes.words.length, message: `成功從 Google 試算表同步 ${cloudRes.words.length} 個單字！` };
      }
      return { ok: false, count: 0, message: 'Google 試算表 Words 分頁中尚無單字資料。' };
    } catch (err: any) {
      return { ok: false, count: 0, message: `同步失敗: ${err.message || '網路異常'}` };
    }
  }

  function setBank(bankId: string) {
    currentBank.value = bankId;
    localStorage.setItem('ewc_selected_bank', bankId);
  }

  return {
    words,
    version,
    loaded,
    currentBank,
    banks,
    activeWords,
    loadWords,
    syncWordsFromCloud,
    setBank
  };
});
