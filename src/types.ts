export interface Word {
  id: string;              // e.g. "YL113-001"
  bank: string;            // e.g. "yilan113"
  no: number;              // 1 - 400
  word: string;            // e.g. "afraid", "Taiwan", "Father's Day"
  meaning: string;         // e.g. "害怕的", "棕色、咖啡色"
  pos?: string;            // e.g. "adj", "n", "v"
  category?: string;       // e.g. "feeling", "color", "holiday"
  alt_spellings?: string;  // e.g. "colour|color"
  tags?: string;
  enabled: boolean;
  note?: string;
  audio_url?: string;      // Reserved for custom human voice
}

export type ItemKind = 'spell' | 'choice';

export interface ExamItem {
  key: string;             // `${wordId}_${kind}`
  word: Word;
  kind: ItemKind;
  options?: string[];      // For choice items: 4 Chinese meanings
  correctMeaning?: string; // For choice items: correct meaning
}

export type Point = [number, number, number, number?]; // [x, y, timestamp, pressure?]
export type Stroke = Point[];
export type Ink = Stroke[];

export interface Player {
  id: string;
  nickname: string;
  avatar: string;          // icon name e.g. 'owl', 'fox', 'bear', 'rabbit', 'lion', 'penguin'
  pinHash: string;         // SHA-256(salt + pin)
  salt: string;
  createdAt: string;
}

export type ExamMode = 'official' | 'mini' | 'practice' | 'range' | 'unfamiliar';

export type JudgeResult = 'ok' | 'ng' | 'unsure';

export interface AnswerItem {
  key: string;
  wordId: string;
  kind: ItemKind;
  userInk?: Ink;           // Hand-drawn strokes
  userText?: string;       // Typed or recognized text
  candidates?: string[];   // Handwriting recognition candidates
  choiceSelected?: string; // For choice mode
  autoJudge: JudgeResult;
  finalJudge: JudgeResult; // Can be toggled manually during review
  clearedCount: number;
  durationMs: number;
}

export interface ExamAttempt {
  id: string;              // unique timestamp-id
  playerId: string;
  playerName?: string;
  mode: ExamMode;
  bank: string;
  startedAt: string;
  durationSec: number;
  spellCorrect: number;
  spellTotal: number;
  choiceCorrect: number;
  choiceTotal: number;
  score: number;           // 0 to 100
  wrongWords: string[];    // list of misspelled or wrong words e.g. ["Taiwan", "afraid"]
  answers: Record<string, AnswerItem>;
  syncedToCloud: boolean;
}

export type Familiarity = 0 | 1 | 2; // 0: 不熟悉, 1: 學習中, 2: 已精熟

export interface WordFamiliarityRecord {
  playerId: string;
  wordId: string;
  level: Familiarity;
  wrongCount: number;
  correctStreak: number;
  lastTestedAt: string;
}

export interface ExamSettingsConfig {
  officialCount: number;       // default 30
  spellRatio: number;          // 0.0 to 1.0 (default 0.5 = 15 spell + 15 choice)
  timeLimitMode: 'total' | 'perQuestion' | 'none'; // default 'total'
  totalMinutes: number;        // default 15
  perQuestionSeconds: number;  // default 20
  autoSpeak: boolean;          // default true
  speechRate: number;          // default 0.85
  requireExactCase: boolean;   // default true (per user directive)
  gasUrl: string;
  gasToken: string;
}
