import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { submitAttemptToCloud } from '../lib/api';
import { saveAttemptInk, saveLocalAttempt } from '../lib/db';
import { buildExam, type BuildExamOptions } from '../lib/examBuilder';
import { judgeSpelling } from '../lib/grading';
import type { AnswerItem, ExamAttempt, ExamItem, ExamMode, JudgeResult } from '../types';
import { useFlashcardStore } from './flashcard';
import { usePlayerStore } from './player';
import { useSettingsStore } from './settings';
import { useWordsStore } from './words';

export const useExamStore = defineStore('exam', () => {
  const currentExam = ref<ExamItem[]>([]);
  const currentIndex = ref<number>(0);
  const currentMode = ref<ExamMode>('practice');
  const selectedBank = ref<string>('yilan113');
  const answers = ref<Record<string, AnswerItem>>({});

  const timeRemainingSec = ref<number>(0);
  const totalDurationSec = ref<number>(0);
  const timerRunning = ref<boolean>(false);
  let timerInterval: number | null = null;

  const activeAttempt = ref<ExamAttempt | null>(null);
  const isFinished = ref<boolean>(false);

  const currentItem = computed(() => currentExam.value[currentIndex.value] || null);
  const isLastQuestion = computed(() => currentIndex.value >= currentExam.value.length - 1);

  const answeredCount = computed(() => {
    return Object.values(answers.value).filter(
      a => (!!a.userInk && a.userInk.length > 0) || (!!a.userText && a.userText.length > 0) || !!a.choiceSelected
    ).length;
  });

  async function startExam(mode: ExamMode, customOptions: BuildExamOptions = {}) {
    const wStore = useWordsStore();
    const pStore = usePlayerStore();
    const sStore = useSettingsStore();
    const fStore = useFlashcardStore();

    if (!wStore.loaded) await wStore.loadWords();
    if (!fStore.loaded) await fStore.loadRecords();

    currentMode.value = mode;
    selectedBank.value = customOptions.bank || wStore.currentBank;
    currentIndex.value = 0;
    answers.value = {};
    isFinished.value = false;

    const opt: BuildExamOptions = {
      bank: selectedBank.value,
      spellRatio: sStore.config.spellRatio,
      familiarity: fStore.records,
      playerId: pStore.currentPlayer?.id || 'guest',
      ...customOptions
    };

    if (mode === 'official') {
      opt.count = sStore.config.officialCount;
    } else if (mode === 'mini') {
      opt.count = 10;
    }

    currentExam.value = buildExam(wStore.words, mode, opt);

    // Initialize answer items
    for (const item of currentExam.value) {
      answers.value[item.key] = {
        key: item.key,
        wordId: item.word.id,
        kind: item.kind,
        autoJudge: 'unsure',
        finalJudge: 'unsure',
        clearedCount: 0,
        durationMs: 0
      };
    }

    // Timer setup
    if (mode === 'official') {
      if (sStore.config.timeLimitMode === 'total') {
        const sec = sStore.config.totalMinutes * 60;
        timeRemainingSec.value = sec;
        totalDurationSec.value = sec;
      } else if (sStore.config.timeLimitMode === 'perQuestion') {
        const sec = sStore.config.perQuestionSeconds;
        timeRemainingSec.value = sec;
        totalDurationSec.value = sec;
      } else {
        timeRemainingSec.value = 0;
        totalDurationSec.value = 0;
      }
    } else if (mode === 'mini') {
      // 3 minutes for 10 questions
      timeRemainingSec.value = 180;
      totalDurationSec.value = 180;
    } else {
      timeRemainingSec.value = 0;
      totalDurationSec.value = 0;
    }

    startTimer();
  }

  function startTimer() {
    stopTimer();
    if (totalDurationSec.value > 0) {
      timerRunning.value = true;
      timerInterval = window.setInterval(() => {
        if (timeRemainingSec.value > 0) {
          timeRemainingSec.value--;
        } else {
          stopTimer();
          finishExam();
        }
      }, 1000);
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerRunning.value = false;
  }

  function recordAnswer(
    key: string,
    payload: {
      ink?: any;
      userText?: string;
      candidates?: string[];
      choiceSelected?: string;
      autoJudge?: JudgeResult;
      cleared?: boolean;
    }
  ) {
    if (!answers.value[key]) return;
    const item = answers.value[key];

    if (payload.ink !== undefined) item.userInk = payload.ink;
    if (payload.userText !== undefined) item.userText = payload.userText;
    if (payload.candidates !== undefined) item.candidates = payload.candidates;
    if (payload.choiceSelected !== undefined) item.choiceSelected = payload.choiceSelected;

    if (payload.autoJudge !== undefined) {
      item.autoJudge = payload.autoJudge;
      item.finalJudge = payload.autoJudge;
    }
    if (payload.cleared) item.clearedCount++;
  }

  function toggleJudge(key: string) {
    const item = answers.value[key];
    if (!item) return;
    if (item.finalJudge === 'ok') item.finalJudge = 'ng';
    else if (item.finalJudge === 'ng') item.finalJudge = 'ok';
    else item.finalJudge = 'ok';
  }

  function setJudge(key: string, judge: JudgeResult) {
    if (answers.value[key]) {
      answers.value[key].finalJudge = judge;
    }
  }

  async function finishExam(): Promise<ExamAttempt> {
    stopTimer();
    isFinished.value = true;

    const pStore = usePlayerStore();
    const sStore = useSettingsStore();
    const fStore = useFlashcardStore();

    const pid = pStore.currentPlayer?.id || 'guest';
    const pName = pStore.currentPlayer?.nickname || '訪客';
    const elapsedSec = totalDurationSec.value > 0 ? totalDurationSec.value - timeRemainingSec.value : 0;

    let spellCorrect = 0;
    let spellTotal = 0;
    let choiceCorrect = 0;
    let choiceTotal = 0;
    const wrongWordsList: string[] = [];

    // Evaluate answers
    for (const item of currentExam.value) {
      const ans = answers.value[item.key];
      let isOk = false;

      if (ans) {
        if (ans.finalJudge === 'unsure') {
          // Re-evaluate if not manually flipped
          if (item.kind === 'spell') {
            const res = judgeSpelling(
              item.word,
              ans.userText,
              ans.candidates,
              sStore.config.requireExactCase
            );
            ans.finalJudge = res.result === 'ok' ? 'ok' : 'ng';
          } else {
            ans.finalJudge = ans.choiceSelected === item.correctMeaning ? 'ok' : 'ng';
          }
        }
        isOk = ans.finalJudge === 'ok';
      }

      if (item.kind === 'spell') {
        spellTotal++;
        if (isOk) spellCorrect++;
        else wrongWordsList.push(item.word.word);
      } else {
        choiceTotal++;
        if (isOk) choiceCorrect++;
        else wrongWordsList.push(item.word.word);
      }

      // Update familiarity record
      await fStore.recordResult(item.word.id, isOk);
    }

    const totalQuestions = spellTotal + choiceTotal;
    const totalCorrect = spellCorrect + choiceCorrect;
    const rawScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const finalScore = Math.round(rawScore * 10) / 10;

    const attempt: ExamAttempt = {
      id: 'att_' + Date.now(),
      playerId: pid,
      playerName: pName,
      mode: currentMode.value,
      bank: selectedBank.value,
      startedAt: new Date().toISOString(),
      durationSec: elapsedSec,
      spellCorrect,
      spellTotal,
      choiceCorrect,
      choiceTotal,
      score: finalScore,
      wrongWords: Array.from(new Set(wrongWordsList)),
      answers: JSON.parse(JSON.stringify(answers.value)),
      syncedToCloud: false
    };

    activeAttempt.value = attempt;

    // Save ink strokes
    for (const [key, ans] of Object.entries(answers.value)) {
      if (ans.userInk) {
        await saveAttemptInk(attempt.id, key, ans.userInk);
      }
    }

    // Save attempt locally
    await saveLocalAttempt(attempt);

    // Sync to cloud
    submitAttemptToCloud(attempt).then(ok => {
      if (ok) attempt.syncedToCloud = true;
    });

    return attempt;
  }

  return {
    currentExam,
    currentIndex,
    currentMode,
    selectedBank,
    answers,
    timeRemainingSec,
    totalDurationSec,
    timerRunning,
    activeAttempt,
    isFinished,
    currentItem,
    isLastQuestion,
    answeredCount,
    startExam,
    startTimer,
    stopTimer,
    recordAnswer,
    toggleJudge,
    setJudge,
    finishExam
  };
});
