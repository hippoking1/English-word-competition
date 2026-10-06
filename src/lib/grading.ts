import type { JudgeResult, Word } from '../types';

/**
 * Clean and normalize word string while preserving case.
 * Standardizes curly single-quotes, accents and irregular spaces.
 */
export function normalizeWordExact(s: string): string {
  if (!s) return '';
  return s
    .normalize('NFKC')
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalized lowercase comparison for fallback or hints
 */
export function normalizeWordLower(s: string): string {
  return normalizeWordExact(s).toLowerCase();
}

/**
 * Get all acceptable answers for a given word
 */
export function getAcceptableAnswers(w: Word, requireExactCase = true): string[] {
  const list = [w.word];
  if (w.alt_spellings && w.alt_spellings.trim().length > 0) {
    const alts = w.alt_spellings.split('|').map(a => a.trim()).filter(a => a.length > 0);
    list.push(...alts);
  }

  return list.map(item => (requireExactCase ? normalizeWordExact(item) : normalizeWordLower(item)));
}

/**
 * Judge spelling answer
 */
export function judgeSpelling(
  w: Word,
  userInput?: string,
  candidates?: string[],
  requireExactCase = true
): {
  result: JudgeResult;
  caseMismatch: boolean;
  matchedAnswer?: string;
} {
  const acceptable = getAcceptableAnswers(w, requireExactCase);
  const acceptableLower = getAcceptableAnswers(w, false);

  // 1. Direct text input check (from virtual keyboard or finalized handwriting text)
  if (userInput && userInput.trim().length > 0) {
    const cleaned = requireExactCase ? normalizeWordExact(userInput) : normalizeWordLower(userInput);
    if (acceptable.includes(cleaned)) {
      return { result: 'ok', caseMismatch: false, matchedAnswer: cleaned };
    }

    // Check if it's correct except for case mismatch
    const cleanedLower = normalizeWordLower(userInput);
    if (acceptableLower.includes(cleanedLower)) {
      return { result: requireExactCase ? 'ng' : 'ok', caseMismatch: true, matchedAnswer: cleanedLower };
    }
  }

  // 2. Candidates from handwriting recognition
  if (candidates && candidates.length > 0) {
    for (let i = 0; i < candidates.length; i++) {
      const cand = requireExactCase ? normalizeWordExact(candidates[i]) : normalizeWordLower(candidates[i]);
      if (acceptable.includes(cand)) {
        // If top-1 matches exactly, consider ok; if top 2~5 matches, mark unsure for review
        return {
          result: i === 0 ? 'ok' : 'unsure',
          caseMismatch: false,
          matchedAnswer: cand
        };
      }
    }

    // Check lowercase matches among candidates
    for (let i = 0; i < candidates.length; i++) {
      const candLower = normalizeWordLower(candidates[i]);
      if (acceptableLower.includes(candLower)) {
        return {
          result: 'unsure',
          caseMismatch: true,
          matchedAnswer: candLower
        };
      }
    }
  }

  return { result: 'ng', caseMismatch: false };
}
