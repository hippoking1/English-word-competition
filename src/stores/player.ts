import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { fetchPlayersFromCloud, syncPlayersToCloud } from '../lib/api';
import { getLocalPlayers, saveLocalPlayers } from '../lib/db';
import { generateSalt, hashPin } from '../lib/pin';
import type { Player } from '../types';

export const usePlayerStore = defineStore('player', () => {
  const players = ref<Player[]>([]);
  const currentId = ref<string>(localStorage.getItem('ewc_current_player_id') || '');
  const loaded = ref<boolean>(false);

  const currentPlayer = computed(() => {
    return players.value.find(p => p.id === currentId.value) || null;
  });

  async function loadPlayers() {
    const local = await getLocalPlayers();
    if (local && local.length > 0) {
      players.value = local;
      loaded.value = true;
    }

    try {
      const cloudPlayers = await fetchPlayersFromCloud();
      if (cloudPlayers && cloudPlayers.length > 0) {
        players.value = cloudPlayers;
        await saveLocalPlayers(cloudPlayers);
      }
    } catch (e) {
      console.warn('Could not sync players from cloud:', e);
    }

    // Default player if empty
    if (players.value.length === 0) {
      const salt = generateSalt();
      const pinHash = await hashPin('1234', salt);
      const defaultP: Player = {
        id: 'p_' + Date.now(),
        nickname: '選手一號',
        avatar: 'owl',
        pinHash,
        salt,
        createdAt: new Date().toISOString()
      };
      players.value = [defaultP];
      await saveLocalPlayers(players.value);
    }

    if (!currentId.value || !players.value.some(p => p.id === currentId.value)) {
      selectPlayer(players.value[0].id);
    }
    loaded.value = true;
  }

  function selectPlayer(id: string) {
    currentId.value = id;
    localStorage.setItem('ewc_current_player_id', id);
  }

  async function addPlayer(nickname: string, avatar: string, pin: string): Promise<Player> {
    const salt = generateSalt();
    const pinHash = await hashPin(pin, salt);
    const newP: Player = {
      id: 'p_' + Date.now(),
      nickname: nickname.trim(),
      avatar,
      pinHash,
      salt,
      createdAt: new Date().toISOString()
    };
    players.value.push(newP);
    await saveLocalPlayers(players.value);
    selectPlayer(newP.id);
    syncPlayersToCloud(players.value).catch(() => {});
    return newP;
  }

  async function updatePlayer(id: string, updates: Partial<Player>): Promise<boolean> {
    const idx = players.value.findIndex(p => p.id === id);
    if (idx === -1) return false;
    players.value[idx] = { ...players.value[idx], ...updates };
    await saveLocalPlayers(players.value);
    syncPlayersToCloud(players.value).catch(() => {});
    return true;
  }

  async function deletePlayer(id: string): Promise<boolean> {
    if (players.value.length <= 1) return false;
    players.value = players.value.filter(p => p.id !== id);
    await saveLocalPlayers(players.value);
    if (currentId.value === id) {
      selectPlayer(players.value[0].id);
    }
    syncPlayersToCloud(players.value).catch(() => {});
    return true;
  }

  async function verifyPin(id: string, pin: string): Promise<boolean> {
    const p = players.value.find(item => item.id === id);
    if (!p) return false;
    const testHash = await hashPin(pin, p.salt);
    return testHash === p.pinHash;
  }

  return {
    players,
    currentId,
    currentPlayer,
    loaded,
    loadPlayers,
    selectPlayer,
    addPlayer,
    updatePlayer,
    deletePlayer,
    verifyPin
  };
});
