<template>
  <div class="profiles-page">
    <div class="picker-card">
      <div class="header">
        <h1 class="title">🏆 國小英語單字王</h1>
        <p class="subtitle">請選擇今天練習的選手</p>
      </div>

      <div class="player-grid">
        <button
          v-for="p in playerStore.players"
          :key="p.id"
          class="player-item"
          @click="handleSelectPlayer(p)"
        >
          <Mascot :avatar="p.avatar" :size="72" />
          <span class="player-name">{{ p.nickname }}</span>
        </button>

        <!-- Add player button (up to 4) -->
        <button
          v-if="playerStore.players.length < 4"
          class="player-item add-btn"
          @click="showAddModal = true"
        >
          <div class="plus-circle">＋</div>
          <span class="player-name">新增選手</span>
        </button>
      </div>

      <div class="footer-actions">
        <button class="parent-link" @click="$router.push('/parent')">
          ⚙️ 家長專區 (管理與設定)
        </button>
      </div>
    </div>

    <!-- PIN Pad Modal for switching player -->
    <div class="modal-overlay" v-if="verifyingPlayer">
      <div class="modal-content">
        <h3>請輸入 {{ verifyingPlayer.nickname }} 的 PIN 碼</h3>
        <PinPad @submit="onPinSubmit" @cancel="verifyingPlayer = null" />
        <p class="pin-hint" v-if="pinError">PIN 碼不正確，請重新輸入 (預設為 1234)</p>
      </div>
    </div>

    <!-- Add Player Modal -->
    <div class="modal-overlay" v-if="showAddModal">
      <div class="modal-content">
        <h3>新增選手</h3>
        <div class="form-group">
          <label>暱稱 / 姓名：</label>
          <input v-model="newNick" placeholder="例如：小明" maxlength="10" />
        </div>
        <div class="form-group">
          <label>選擇代表頭像：</label>
          <div class="avatar-options">
            <button
              v-for="av in avatarOptions"
              :key="av"
              class="av-opt"
              :class="{ selected: newAvatar === av }"
              @click="newAvatar = av"
            >
              <Mascot :avatar="av" :size="48" />
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>設定 4 位數 PIN 碼：</label>
          <input v-model="newPin" type="password" maxlength="4" placeholder="例如：1234" />
        </div>

        <div class="modal-buttons">
          <button class="btn-cancel" @click="showAddModal = false">取消</button>
          <button class="btn-confirm" @click="handleCreatePlayer" :disabled="!newNick || newPin.length !== 4">
            確認新增
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Mascot from '../components/Mascot.vue';
import { usePlayerStore } from '../stores/player';
import type { Player } from '../types';
import PinPad from './PinPad.vue';

const router = useRouter();
const playerStore = usePlayerStore();

const verifyingPlayer = ref<Player | null>(null);
const pinError = ref(false);

const showAddModal = ref(false);
const newNick = ref('');
const newAvatar = ref('owl');
const newPin = ref('1234');
const avatarOptions = ['owl', 'fox', 'bear', 'rabbit', 'lion', 'penguin'];

function handleSelectPlayer(p: Player) {
  // Directly select if PIN is 1234 default or ask PIN
  verifyingPlayer.value = p;
  pinError.value = false;
}

async function onPinSubmit(pin: string) {
  if (!verifyingPlayer.value) return;
  const ok = await playerStore.verifyPin(verifyingPlayer.value.id, pin);
  if (ok) {
    playerStore.selectPlayer(verifyingPlayer.value.id);
    verifyingPlayer.value = null;
    router.push('/home');
  } else {
    pinError.value = true;
  }
}

async function handleCreatePlayer() {
  if (!newNick.value.trim() || newPin.value.length !== 4) return;
  const created = await playerStore.addPlayer(newNick.value, newAvatar.value, newPin.value);
  showAddModal.value = false;
  newNick.value = '';
  router.push('/home');
}

onMounted(async () => {
  await playerStore.loadPlayers();
});
</script>

<style scoped>
.profiles-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.picker-card {
  background: white;
  padding: 36px 32px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 560px;
  text-align: center;
}

.title {
  font-family: var(--font-title);
  font-size: 32px;
  color: var(--color-primary-dark);
  margin-bottom: 6px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 16px;
  margin-bottom: 28px;
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.player-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 8px;
  border: 2px solid #e2e8f0;
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.player-item:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.player-name {
  font-weight: 800;
  color: #1e293b;
  font-size: 15px;
}

.add-btn {
  border-style: dashed;
  background: #f8fafc;
}

.plus-circle {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #64748b;
}

.parent-link {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  background: #f1f5f9;
}

.parent-link:hover {
  color: var(--color-primary-dark);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: var(--radius-lg);
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-xl);
}

.pin-hint {
  color: #ef4444;
  font-size: 13px;
  font-weight: 700;
  margin-top: 10px;
}

.form-group {
  margin-top: 14px;
  text-align: left;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  display: block;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-size: 15px;
}

.avatar-options {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.av-opt {
  border-radius: 999px;
  padding: 2px;
  border: 2px solid transparent;
}

.av-opt.selected {
  border-color: var(--color-primary);
  background: #eff6ff;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 10px 0;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 15px;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-confirm {
  background: var(--color-primary);
  color: white;
}

.btn-confirm:disabled {
  opacity: 0.5;
}
</style>
