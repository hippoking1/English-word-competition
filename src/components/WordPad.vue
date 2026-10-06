<template>
  <div class="word-pad-container">
    <!-- Candidates bar from handwriting recognition -->
    <div class="candidates-bar" v-if="candidates.length > 0">
      <span class="cand-label">辨識候選：</span>
      <div class="cand-scroll">
        <button
          v-for="(cand, idx) in candidates"
          :key="idx"
          class="cand-btn"
          :class="{ selected: selectedText === cand }"
          @click="selectCandidate(cand)"
        >
          {{ cand }}
        </button>
      </div>
    </div>

    <!-- Canvas area with four-line grid guide -->
    <div class="canvas-wrapper four-line-grid" ref="wrapperRef">
      <canvas
        ref="canvasRef"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
      ></canvas>

      <div class="status-overlay" v-if="isRecognizing">
        <span class="loading-spin"></span> 辨識中...
      </div>
    </div>

    <!-- Actions toolbar -->
    <div class="pad-toolbar">
      <div class="current-recog">
        <span class="recog-label">目前字詞：</span>
        <span class="recog-val">{{ selectedText || '(手寫後自動辨識)' }}</span>
      </div>
      <div class="tool-actions">
        <button class="tool-btn" @click="undoStroke" :disabled="strokes.length === 0">
          ↩️ 復原
        </button>
        <button class="tool-btn danger" @click="clearCanvas" :disabled="strokes.length === 0 && !selectedText">
          🗑️ 清除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { recognizeEnglishWithGoogle } from '../lib/handwriting';
import type { Ink, Point, Stroke } from '../types';

const props = defineProps<{
  initialInk?: Ink;
  initialText?: string;
}>();

const emit = defineEmits<{
  (e: 'change', payload: { ink: Ink; text: string; candidates: string[] }): void;
  (e: 'clear'): void;
}>();

const wrapperRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const strokes = ref<Ink>([]);
const currentStroke = ref<Stroke>([]);
const isDrawing = ref(false);

const candidates = ref<string[]>([]);
const selectedText = ref<string>(props.initialText || '');
const isRecognizing = ref(false);

let recogTimeout: number | null = null;

function initCanvasSize() {
  if (!wrapperRef.value || !canvasRef.value) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const canvas = canvasRef.value;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    redraw();
  }
}

function redraw() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  const rect = canvasRef.value.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const allStrokes = [...strokes.value];
  if (currentStroke.value.length > 0) {
    allStrokes.push(currentStroke.value);
  }

  for (const stroke of allStrokes) {
    if (stroke.length === 0) continue;
    if (stroke.length === 1) {
      ctx.beginPath();
      ctx.arc(stroke[0][0], stroke[0][1], 1.5, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    for (let i = 1; i < stroke.length - 1; i++) {
      const xc = (stroke[i][0] + stroke[i + 1][0]) / 2;
      const yc = (stroke[i][1] + stroke[i + 1][1]) / 2;
      ctx.quadraticCurveTo(stroke[i][0], stroke[i][1], xc, yc);
    }
    const last = stroke[stroke.length - 1];
    ctx.lineTo(last[0], last[1]);
    ctx.stroke();
  }
}

function handlePointerDown(e: PointerEvent) {
  if (!canvasRef.value) return;
  canvasRef.value.setPointerCapture(e.pointerId);
  isDrawing.value = true;

  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const point: Point = [x, y, Date.now(), e.pressure || 0.5];

  currentStroke.value = [point];
  redraw();

  if (recogTimeout) {
    clearTimeout(recogTimeout);
    recogTimeout = null;
  }
}

function handlePointerMove(e: PointerEvent) {
  if (!isDrawing.value || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const point: Point = [x, y, Date.now(), e.pressure || 0.5];

  currentStroke.value.push(point);
  redraw();
}

function handlePointerUp(e: PointerEvent) {
  if (!isDrawing.value) return;
  isDrawing.value = false;

  if (currentStroke.value.length > 0) {
    strokes.value.push([...currentStroke.value]);
    currentStroke.value = [];
  }

  // Schedule recognition after 600ms idle
  if (recogTimeout) clearTimeout(recogTimeout);
  recogTimeout = window.setTimeout(triggerRecognition, 600);
}

async function triggerRecognition() {
  if (strokes.value.length === 0) return;
  if (!wrapperRef.value) return;

  isRecognizing.value = true;
  const rect = wrapperRef.value.getBoundingClientRect();

  try {
    const list = await recognizeEnglishWithGoogle(strokes.value, rect.width, rect.height);
    candidates.value = list;
    if (list.length > 0) {
      selectedText.value = list[0]; // Auto pick top-1
      emit('change', {
        ink: strokes.value,
        text: selectedText.value,
        candidates: list
      });
    }
  } finally {
    isRecognizing.value = false;
  }
}

function selectCandidate(cand: string) {
  selectedText.value = cand;
  emit('change', {
    ink: strokes.value,
    text: cand,
    candidates: candidates.value
  });
}

function undoStroke() {
  if (strokes.value.length === 0) return;
  strokes.value.pop();
  redraw();

  if (strokes.value.length === 0) {
    clearCanvas();
  } else {
    triggerRecognition();
  }
}

function clearCanvas() {
  strokes.value = [];
  currentStroke.value = [];
  candidates.value = [];
  selectedText.value = '';
  redraw();
  emit('clear');
}

watch(
  () => props.initialInk,
  newInk => {
    if (newInk) {
      strokes.value = JSON.parse(JSON.stringify(newInk));
      redraw();
    }
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    initCanvasSize();
    if (props.initialInk && props.initialInk.length > 0) {
      strokes.value = JSON.parse(JSON.stringify(props.initialInk));
      redraw();
    }
    window.addEventListener('resize', initCanvasSize);
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', initCanvasSize);
  if (recogTimeout) clearTimeout(recogTimeout);
});
</script>

<style scoped>
.word-pad-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
}

.candidates-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.cand-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
}

.cand-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
}

.cand-btn {
  padding: 4px 10px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  white-space: nowrap;
}

.cand-btn.selected {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  border: 2px solid #cbd5e1;
  border-radius: var(--radius-md);
  background-color: #ffffff;
  overflow: hidden;
  touch-action: none;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

.status-overlay {
  position: absolute;
  top: 8px;
  right: 12px;
  background: rgba(15, 23, 42, 0.75);
  color: white;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}

.loading-spin {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pad-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.current-recog {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.recog-label {
  color: #64748b;
  font-weight: 600;
}

.recog-val {
  color: #0f172a;
  font-weight: 800;
  font-size: 16px;
}

.tool-actions {
  display: flex;
  gap: 8px;
}

.tool-btn {
  padding: 6px 12px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-btn.danger {
  color: #dc2626;
  border-color: #fca5a5;
  background: #fef2f2;
}
</style>
