const TONE_MAP: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  A: ['Ā', 'Á', 'Ǎ', 'À', 'A'],
  E: ['Ē', 'É', 'Ě', 'È', 'E'],
  I: ['Ī', 'Í', 'Ǐ', 'Ì', 'I'],
  O: ['Ō', 'Ó', 'Ǒ', 'Ò', 'O'],
  U: ['Ū', 'Ú', 'Ǔ', 'Ù', 'U'],
  Ü: ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü'],
  V: ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü'],
};

function convertSyllable(syll: string): string {
  const m = syll.match(/^([a-zA-ZüÜ]*?)([a-zA-ZüÜ]+?)([1-5])$/);
  if (!m) return syll;
  const prefix = m[1] || '';
  const base = m[2];
  const tone = parseInt(m[3], 10) - 1;

  const priority = ['a', 'o', 'e', 'i', 'u', 'ü'];
  let lower = base.toLowerCase();
  let idx = -1;
  for (const v of priority) {
    const i = lower.indexOf(v);
    if (i !== -1) { idx = i; break; }
  }
  if (idx === -1) return prefix + base;

  const origChar = base[idx];
  const replacement = TONE_MAP[origChar]?.[tone] ?? origChar;
  return prefix + base.slice(0, idx) + replacement + base.slice(idx + 1);
}

export function numericPinyinToMarked(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map(convertSyllable)
    .join(' ');
}

export function hasNumericTones(input: string): boolean {
  return /\b[a-zA-ZüÜ]+[1-5]\b/.test(input);
}

function stripTones(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[1-5]/g, '')
    .toLowerCase()
    .trim();
}

export function pinyinMatches(input: string, target: string): boolean {
  const a = stripTones(input);
  const b = stripTones(target);
  if (!a || !b) return false;
  return a === b;
}

export function normalizePinyinInput(input: string): string {
  if (hasNumericTones(input)) return numericPinyinToMarked(input);
  return input.trim();
}
