import { useMemo } from 'react';
import type { Vocab } from './types';

// Regex to match CJK Unified Ideographs (standard Chinese characters)
const CJK_REGEX = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;

/**
 * Extract all unique CJK characters from a string.
 */
export function extractCJK(text: string): string[] {
  const matches = text.match(CJK_REGEX) ?? [];
  return [...new Set(matches)];
}

/**
 * A character group: one CJK character shared by multiple vocab words.
 */
export interface CharacterGroup {
  character: string;
  /** All vocab words containing this character */
  words: Vocab[];
  /** How many unique characters appear in those words (network density) */
  density: number;
}

/**
 * Pre-computes the full character association network from the entire vocab store.
 *
 * Returns a list of CharacterGroups, sorted by word count descending.
 * Only includes characters that appear in ≥2 words (i.e., actually form a "link").
 * Singleton characters (appear in only 1 word) are available separately.
 */
export function useCharacterNetwork(vocab: Vocab[]) {
  /**
   * The main pre-computed map: character → list of vocab that contain it.
   * Memoised so it only recomputes when vocab changes.
   */
  const charMap = useMemo<Map<string, Vocab[]>>(() => {
    const map = new Map<string, Vocab[]>();
    for (const v of vocab) {
      const chars = extractCJK(v.hanzi);
      for (const ch of chars) {
        if (!map.has(ch)) map.set(ch, []);
        map.get(ch)!.push(v);
      }
    }
    return map;
  }, [vocab]);

  /**
   * Sorted list of character groups that appear in ≥2 words.
   * These are the "network nodes" shown in the overview grid.
   */
  const networkGroups = useMemo<CharacterGroup[]>(() => {
    const groups: CharacterGroup[] = [];
    charMap.forEach((words, character) => {
      if (words.length >= 2) {
        // density = how many distinct characters appear across these words (richness)
        const allChars = new Set(words.flatMap((w) => extractCJK(w.hanzi)));
        groups.push({ character, words, density: allChars.size });
      }
    });
    // Sort: most connected first, then by character code for stability
    return groups.sort((a, b) => b.words.length - a.words.length || a.character.localeCompare(b.character));
  }, [charMap]);

  /**
   * Characters that appear in only 1 word (no network link yet).
   */
  const singletons = useMemo<CharacterGroup[]>(() => {
    const groups: CharacterGroup[] = [];
    charMap.forEach((words, character) => {
      if (words.length === 1) {
        groups.push({ character, words, density: extractCJK(words[0].hanzi).length });
      }
    });
    return groups.sort((a, b) => a.character.localeCompare(b.character));
  }, [charMap]);

  /** Total number of CJK characters found across all vocab */
  const totalCharacters = charMap.size;

  /** Total number of unique connections (character groups with ≥2 words) */
  const totalLinks = networkGroups.length;

  /**
   * Get all words for a given character (used when drilling into a group).
   */
  const getWordsForCharacter = useMemo(() => {
    return (character: string): Vocab[] => charMap.get(character) ?? [];
  }, [charMap]);

  return {
    networkGroups,
    singletons,
    totalCharacters,
    totalLinks,
    getWordsForCharacter,
  };
}
