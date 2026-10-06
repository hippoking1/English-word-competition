import fs from 'fs';
import path from 'path';

interface RawWord {
  id: string;
  bank: string;
  no: number;
  word: string;
  meaning: string;
  pos: string;
  category: string;
  alt_spellings: string;
  tags: string;
  enabled: boolean;
  note: string;
}

function parseCSV(content: string): RawWord[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const results: RawWord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser handling quoted tokens
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        tokens.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    tokens.push(current.trim());

    if (tokens.length >= 5) {
      results.push({
        id: tokens[0] || '',
        bank: tokens[1] || 'yilan113',
        no: parseInt(tokens[2] || '0', 10),
        word: tokens[3] || '',
        meaning: tokens[4] || '',
        pos: tokens[5] || '',
        category: tokens[6] || '',
        alt_spellings: tokens[7] || '',
        tags: tokens[8] || '',
        enabled: (tokens[9] || 'TRUE').toUpperCase() === 'TRUE',
        note: tokens[10] || ''
      });
    }
  }

  return results;
}

const csvPath = path.resolve(process.cwd(), 'data/words.csv');
const jsonPath = path.resolve(process.cwd(), 'public/words.json');

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const words = parseCSV(csvContent);

fs.writeFileSync(jsonPath, JSON.stringify(words, null, 2), 'utf-8');
console.log(`Successfully converted ${words.length} words from CSV to public/words.json!`);
