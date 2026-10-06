import type { ExamItem, ExamMode, Word, WordFamiliarityRecord } from '../types';

/**
 * Deterministic pseudo-random number generator (Mulberry32) for reproducible daily challenges
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(arr: T[], rng = Math.random): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generate advanced distractor options for choice questions:
 * Prioritizes same category, then same part-of-speech (pos),
 * strictly avoids any overlapping meanings.
 */
export function buildChoiceOptions(
  target: Word,
  pool: Word[],
  rng = Math.random
): { options: string[]; correctMeaning: string } {
  const correctMeaning = target.meaning;
  // Parse target meanings to avoid synonyms
  const targetMeanings = target.meaning
    .split(/[,、，]/)
    .map(m => m.trim())
    .filter(m => m.length > 0);

  const isOverlap = (meaning: string) => {
    const tokens = meaning.split(/[,、，]/).map(m => m.trim());
    return tokens.some(t => targetMeanings.includes(t) || target.meaning.includes(t) || meaning.includes(target.meaning));
  };

  // Candidates: must have different id and non-overlapping meaning
  const validPool = pool.filter(w => w.id !== target.id && !isOverlap(w.meaning));

  // 1. Same category
  const sameCategory = target.category
    ? validPool.filter(w => w.category === target.category)
    : [];

  // 2. Same part of speech
  const samePos = target.pos
    ? validPool.filter(w => w.pos === target.pos && (!target.category || w.category !== target.category))
    : [];

  // 3. Other words
  const others = validPool.filter(
    w => (!target.category || w.category !== target.category) && (!target.pos || w.pos !== target.pos)
  );

  const selectedDistractors: Word[] = [];
  const pickedMeanings = new Set<string>([correctMeaning]);

  const tryAdd = (list: Word[]) => {
    const shuffled = shuffleArray(list, rng);
    for (const w of shuffled) {
      if (selectedDistractors.length >= 3) break;
      if (!pickedMeanings.has(w.meaning)) {
        selectedDistractors.push(w);
        pickedMeanings.add(w.meaning);
      }
    }
  };

  tryAdd(sameCategory);
  if (selectedDistractors.length < 3) tryAdd(samePos);
  if (selectedDistractors.length < 3) tryAdd(others);

  const allMeanings = [correctMeaning, ...selectedDistractors.map(d => d.meaning)];
  return {
    options: shuffleArray(allMeanings, rng),
    correctMeaning
  };
}

export interface BuildExamOptions {
  count?: number;
  spellRatio?: number; // 0.0 to 1.0 (default 0.5)
  bank?: string;
  rangeStart?: number;
  rangeEnd?: number;
  familiarity?: Record<string, WordFamiliarityRecord>;
  dateString?: string; // e.g. "2026-10-06" for daily mini seed
  playerId?: string;
  customWordIds?: string[];
}

export function buildExam(
  words: Word[],
  mode: ExamMode,
  options: BuildExamOptions = {}
): ExamItem[] {
  let pool = words.filter(w => w.enabled);
  const bank = options.bank || 'yilan113';
  if (bank !== 'all') {
    pool = pool.filter(w => w.bank === bank);
  }

  let rng = Math.random;

  if (mode === 'mini') {
    // Deterministic seed by date + player
    const dateStr = options.dateString || new Date().toISOString().slice(0, 10);
    const seedInput = `${dateStr}_${options.playerId || 'guest'}`;
    let seed = 0;
    for (let i = 0; i < seedInput.length; i++) {
      seed = (seed * 31 + seedInput.charCodeAt(i)) >>> 0;
    }
    rng = mulberry32(seed);
  }

  // Filter pool by mode
  if (mode === 'unfamiliar' && options.familiarity) {
    const unFamMap = options.familiarity;
    const unfamiliarWords = pool.filter(w => {
      const rec = unFamMap[w.id];
      return !rec || rec.level === 0 || rec.wrongCount > 0;
    });
    if (unfamiliarWords.length > 0) {
      pool = unfamiliarWords;
    }
  } else if (mode === 'range') {
    const start = options.rangeStart || 1;
    const end = options.rangeEnd || 400;
    pool = pool.filter(w => w.no >= start && w.no <= end);
  }

  if (options.customWordIds && options.customWordIds.length > 0) {
    const idSet = new Set(options.customWordIds);
    pool = pool.filter(w => idSet.has(w.id));
  }

  const totalCount = Math.min(
    pool.length,
    options.count || (mode === 'mini' ? 10 : mode === 'official' ? 30 : 20)
  );

  const shuffledPool = shuffleArray(pool, rng);
  const pickedWords = shuffledPool.slice(0, totalCount);

  // Ratio of spelling questions
  const spellRatio = options.spellRatio !== undefined ? options.spellRatio : 0.5;
  const spellCount = Math.round(totalCount * spellRatio);

  const items: ExamItem[] = [];

  for (let i = 0; i < pickedWords.length; i++) {
    const word = pickedWords[i];
    const isSpell = i < spellCount;

    if (isSpell) {
      items.push({
        key: `${word.id}_spell`,
        word,
        kind: 'spell'
      });
    } else {
      const choiceInfo = buildChoiceOptions(word, words, rng);
      items.push({
        key: `${word.id}_choice`,
        word,
        kind: 'choice',
        options: choiceInfo.options,
        correctMeaning: choiceInfo.correctMeaning
      });
    }
  }

  // Shuffle final exam items so spell and choice alternate nicely
  return shuffleArray(items, rng);
}
