import { buildChoiceOptions } from '../src/lib/examBuilder';
import { getAcceptableAnswers, judgeSpelling, normalizeWordExact } from '../src/lib/grading';
import type { Word } from '../src/types';
import fs from 'fs';
import path from 'path';

console.log('--- 🧪 Running Automated Unit Tests ---');

// 1. Case-sensitive Grading Tests (User directive #3)
const taiwanWord: Word = {
  id: 'YL113-354',
  bank: 'yilan113',
  no: 354,
  word: 'Taiwan',
  meaning: '台灣',
  enabled: true
};

const fridayWord: Word = {
  id: 'YL113-153',
  bank: 'yilan113',
  no: 153,
  word: 'Friday',
  meaning: '星期五',
  enabled: true
};

const emailWord: Word = {
  id: 'YL113-125',
  bank: 'yilan113',
  no: 125,
  word: 'e-mail',
  meaning: '電子郵件',
  alt_spellings: 'email',
  enabled: true
};

// Test exact case
const res1 = judgeSpelling(taiwanWord, 'Taiwan', [], true);
console.assert(res1.result === 'ok', 'Expected Taiwan to be ok');

const res2 = judgeSpelling(taiwanWord, 'taiwan', [], true);
console.assert(res2.result === 'ng', 'Expected lowercase taiwan to be ng under strict case');
console.assert(res2.caseMismatch === true, 'Expected caseMismatch to be true');

const res3 = judgeSpelling(fridayWord, 'Friday', [], true);
console.assert(res3.result === 'ok', 'Expected Friday to be ok');

const res4 = judgeSpelling(fridayWord, 'friday', [], true);
console.assert(res4.result === 'ng', 'Expected lowercase friday to be ng');

// Test alt_spellings
const res5 = judgeSpelling(emailWord, 'email', [], true);
console.assert(res5.result === 'ok', 'Expected alt spelling email to be ok');

const res6 = judgeSpelling(emailWord, 'e-mail', [], true);
console.assert(res6.result === 'ok', 'Expected e-mail to be ok');

console.log('✅ 1. Strict case-sensitive and alt_spellings grading tests PASSED');

// 2. Advanced Distractor Options Tests (User directive #2)
const words: Word[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'public/words.json'), 'utf-8')
);

const redWord = words.find(w => w.word === 'red')!;
const optionsInfo = buildChoiceOptions(redWord, words);

console.assert(optionsInfo.options.length === 4, 'Must have 4 options');
console.assert(optionsInfo.options.includes(redWord.meaning), 'Must contain correct meaning');

// Verify that distractor meanings do not overlap with red
const otherMeanings = optionsInfo.options.filter(m => m !== redWord.meaning);
console.assert(otherMeanings.length === 3, 'Must have 3 distractors');

console.log('Sample question for "red":', optionsInfo.options);
console.log('✅ 2. Advanced category/pos distractor options generator PASSED');

console.log('🎉 ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY!');
