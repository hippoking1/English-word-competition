import fs from 'fs';
import path from 'path';

interface WordItem {
  id: string;
  bank: string;
  no: number;
  word: string;
  meaning: string;
  pos: string;
  category: string;
  alt_spellings?: string;
  enabled: boolean;
}

const jsonPath = path.resolve(process.cwd(), 'public/words.json');
if (!fs.existsSync(jsonPath)) {
  console.error('Error: public/words.json does not exist. Run npm run words first.');
  process.exit(1);
}

const words: WordItem[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
console.log(`Validating ${words.length} words in dataset...`);

let hasErrors = false;
const idSet = new Set<string>();
const noSet = new Set<number>();

if (words.length !== 400) {
  console.error(`Error: Expected exactly 400 words, but got ${words.length}`);
  hasErrors = true;
}

for (let i = 0; i < words.length; i++) {
  const w = words[i];

  if (!w.id) {
    console.error(`Row ${i + 1}: Missing id`);
    hasErrors = true;
  } else if (idSet.has(w.id)) {
    console.error(`Row ${i + 1}: Duplicate id '${w.id}'`);
    hasErrors = true;
  }
  idSet.add(w.id);

  if (noSet.has(w.no)) {
    console.error(`Row ${i + 1}: Duplicate no '${w.no}'`);
    hasErrors = true;
  }
  noSet.add(w.no);

  if (!w.word || w.word.trim().length === 0) {
    console.error(`Row ${i + 1}: Empty word string`);
    hasErrors = true;
  }

  if (!w.meaning || w.meaning.trim().length === 0) {
    console.error(`Row ${i + 1}: Empty meaning string for '${w.word}'`);
    hasErrors = true;
  }

  // Check valid English chars
  if (!/^[A-Za-z0-9\s'\-\(\)]+$/.test(w.word)) {
    console.error(`Row ${i + 1}: Invalid characters in word '${w.word}'`);
    hasErrors = true;
  }

  if (!w.category) {
    console.warn(`Row ${i + 1}: Missing category for '${w.word}'`);
  }
}

// Check sequential 1..400
for (let n = 1; n <= 400; n++) {
  if (!noSet.has(n)) {
    console.error(`Missing question no: ${n}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ Dataset validation FAILED with errors.');
  process.exit(1);
} else {
  console.log('\n✅ All 400 words verified successfully! Dataset is healthy and consistent.');
}
