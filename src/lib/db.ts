import { get, set, del } from 'idb-keyval';
import type { ExamAttempt, Ink, Player, Word, WordFamiliarityRecord } from '../types';

const PREFIX = 'ewc_';
const KEY_WORDS = `${PREFIX}words`;
const KEY_PLAYERS = `${PREFIX}players`;
const KEY_ATTEMPTS = `${PREFIX}attempts`;
const KEY_FAMILIARITY = `${PREFIX}familiarity`;
const KEY_OUTBOX = `${PREFIX}outbox`;

function toPlain<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
}

export async function getLocalWords(): Promise<Word[] | null> {
  return (await get<Word[]>(KEY_WORDS)) || null;
}

export async function saveLocalWords(words: Word[]): Promise<void> {
  await set(KEY_WORDS, toPlain(words));
}

export async function getLocalPlayers(): Promise<Player[]> {
  return (await get<Player[]>(KEY_PLAYERS)) || [];
}

export async function saveLocalPlayers(players: Player[]): Promise<void> {
  await set(KEY_PLAYERS, toPlain(players));
}

export async function getLocalAttempts(playerId?: string): Promise<ExamAttempt[]> {
  const all = (await get<ExamAttempt[]>(KEY_ATTEMPTS)) || [];
  if (!playerId) return all;
  return all.filter(a => a.playerId === playerId);
}

export async function saveLocalAttempt(attempt: ExamAttempt): Promise<void> {
  const all = (await get<ExamAttempt[]>(KEY_ATTEMPTS)) || [];
  const idx = all.findIndex(a => a.id === attempt.id);
  if (idx >= 0) {
    all[idx] = attempt;
  } else {
    all.unshift(attempt);
  }
  // Keep up to 60 recent attempts
  if (all.length > 60) {
    all.length = 60;
  }
  await set(KEY_ATTEMPTS, toPlain(all));
}

export async function getLocalFamiliarity(playerId: string): Promise<Record<string, WordFamiliarityRecord>> {
  const all = (await get<Record<string, Record<string, WordFamiliarityRecord>>>(KEY_FAMILIARITY)) || {};
  return all[playerId] || {};
}

export async function saveLocalFamiliarity(playerId: string, records: Record<string, WordFamiliarityRecord>): Promise<void> {
  const all = (await get<Record<string, Record<string, WordFamiliarityRecord>>>(KEY_FAMILIARITY)) || {};
  all[playerId] = records;
  await set(KEY_FAMILIARITY, toPlain(all));
}

export async function getOfflineOutbox(): Promise<ExamAttempt[]> {
  return (await get<ExamAttempt[]>(KEY_OUTBOX)) || [];
}

export async function addToOfflineOutbox(attempt: ExamAttempt): Promise<void> {
  const outbox = await getOfflineOutbox();
  if (!outbox.some(a => a.id === attempt.id)) {
    outbox.push(attempt);
    await set(KEY_OUTBOX, toPlain(outbox));
  }
}

export async function removeFromOfflineOutbox(attemptId: string): Promise<void> {
  const outbox = await getOfflineOutbox();
  const filtered = outbox.filter(a => a.id !== attemptId);
  await set(KEY_OUTBOX, toPlain(filtered));
}

export async function saveAttemptInk(attemptId: string, itemKey: string, ink: Ink): Promise<void> {
  const key = `${PREFIX}ink_${attemptId}_${itemKey}`;
  await set(key, toPlain(ink));
}

export async function getAttemptInk(attemptId: string, itemKey: string): Promise<Ink | null> {
  const key = `${PREFIX}ink_${attemptId}_${itemKey}`;
  return (await get<Ink>(key)) || null;
}
