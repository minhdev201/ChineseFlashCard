import type { Vocab } from './types';

export interface ParsedVocabItem {
  tempId: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  originalLine: string;
  lineNumber: number;
  status: 'valid' | 'duplicate_store' | 'duplicate_batch' | 'error';
  errorMessage?: string;
}

export interface ParseResult {
  items: ParsedVocabItem[];
  validCount: number;
  storeDuplicateCount: number;
  batchDuplicateCount: number;
  errorCount: number;
}

// Check if a line looks like a table header or markdown separator
function isHeaderOrDivider(line: string): boolean {
  const lower = line.toLowerCase();
  if (/^[|\s\-:]+$/.test(line)) return true;
  if (
    (lower.includes('hán ngữ') || lower.includes('hán tự') || lower.includes('hanzi') || lower.includes('chữ hán')) &&
    (lower.includes('pinyin') || lower.includes('phiên âm')) &&
    (lower.includes('nghĩa') || lower.includes('meaning'))
  ) {
    return true;
  }
  return false;
}

// Clean prefixes like "1. ", "1/ ", "- ", "* ", "• "
function cleanHanziPrefix(hanzi: string): string {
  return hanzi
    .replace(/^(\d+[\.\/\)\-:]|\*+|\-+|\•)\s*/, '')
    .trim();
}

export function parseBulkVocab(
  rawText: string,
  existingVocab: Vocab[] = []
): ParseResult {
  const lines = rawText.split(/\r?\n/);
  const items: ParsedVocabItem[] = [];
  const seenInBatch = new Set<string>();
  const existingHanziSet = new Set(existingVocab.map((v) => v.hanzi.trim()));

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) return;
    if (isHeaderOrDivider(trimmed)) return;

    const lineNumber = idx + 1;
    let parts: string[] = [];

    // Check if line is formatted with pipes "|" (including markdown table rows)
    if (trimmed.includes('|')) {
      const stripped = trimmed.replace(/^\|/, '').replace(/\|$/, '');
      parts = stripped.split('|').map((p) => p.trim());
    } else if (trimmed.includes('\t')) {
      // Tab-separated (e.g. copied from ChatGPT table)
      parts = trimmed.split('\t').map((p) => p.trim());
    } else if (trimmed.includes(' - ') && trimmed.split(' - ').length >= 3) {
      // Dash-separated
      parts = trimmed.split(' - ').map((p) => p.trim());
    }

    if (parts.length < 3) {
      items.push({
        tempId: `row-${lineNumber}`,
        hanzi: parts[0] || trimmed,
        pinyin: parts[1] || '',
        meaning: parts.slice(2).join(' | ') || '',
        originalLine: rawLine,
        lineNumber,
        status: 'error',
        errorMessage: 'Cần đủ 3 phần phân cách bởi dấu "|": [Hán ngữ] | [Pinyin] | [Nghĩa]',
      });
      return;
    }

    const rawHanzi = cleanHanziPrefix(parts[0]);
    const pinyin = parts[1].trim();
    // Meaning can contain extra pipes if meaning had "|" inside, join them
    const meaning = parts.slice(2).join(' | ').trim();

    if (!rawHanzi || !pinyin || !meaning) {
      items.push({
        tempId: `row-${lineNumber}`,
        hanzi: rawHanzi,
        pinyin,
        meaning,
        originalLine: rawLine,
        lineNumber,
        status: 'error',
        errorMessage: 'Thiếu Hán ngữ, Pinyin hoặc Nghĩa tiếng Việt',
      });
      return;
    }

    // Check for duplicate in store
    if (existingHanziSet.has(rawHanzi)) {
      items.push({
        tempId: `row-${lineNumber}`,
        hanzi: rawHanzi,
        pinyin,
        meaning,
        originalLine: rawLine,
        lineNumber,
        status: 'duplicate_store',
        errorMessage: 'Đã có trong kho từ vựng',
      });
      seenInBatch.add(rawHanzi);
      return;
    }

    // Check for duplicate in batch
    if (seenInBatch.has(rawHanzi)) {
      items.push({
        tempId: `row-${lineNumber}`,
        hanzi: rawHanzi,
        pinyin,
        meaning,
        originalLine: rawLine,
        lineNumber,
        status: 'duplicate_batch',
        errorMessage: 'Bị trùng lặp trong chính danh sách này',
      });
      return;
    }

    seenInBatch.add(rawHanzi);

    items.push({
      tempId: `row-${lineNumber}`,
      hanzi: rawHanzi,
      pinyin,
      meaning,
      originalLine: rawLine,
      lineNumber,
      status: 'valid',
    });
  });

  const validCount = items.filter((i) => i.status === 'valid').length;
  const storeDuplicateCount = items.filter((i) => i.status === 'duplicate_store').length;
  const batchDuplicateCount = items.filter((i) => i.status === 'duplicate_batch').length;
  const errorCount = items.filter((i) => i.status === 'error').length;

  return {
    items,
    validCount,
    storeDuplicateCount,
    batchDuplicateCount,
    errorCount,
  };
}
