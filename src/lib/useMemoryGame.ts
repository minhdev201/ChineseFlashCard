import { useState, useEffect, useCallback } from 'react';
import type { Vocab } from './types';

export type GameMode = '6x5' | '7x5' | '8x5';

export const GAME_MODE_COUNTS: Record<GameMode, number> = {
  '6x5': 30,
  '7x5': 35,
  '8x5': 40,
};

export interface GridCell {
  id: number;
  word: Vocab;
  isTarget: boolean;
  state: 'idle' | 'correct' | 'wrong';
}

export interface MemoryGameState {
  phase: 'setup' | 'playing' | 'result';
  mode: GameMode;
  selectedWords: Vocab[];
  gameWords: Vocab[];
  grid: GridCell[];
  currentWordIndex: number;
  foundWords: Set<string>;
  score: number;
  combo: number;
  maxCombo: number;
  mistakes: number;
  startTime: number;
  elapsedTime: number;
}

const POINTS_PER_CORRECT = 10;
const COMBO_MULTIPLIER = 2;

export function useMemoryGame() {
  const [state, setState] = useState<MemoryGameState>({
    phase: 'setup',
    mode: '6x5',
    selectedWords: [],
    gameWords: [],
    grid: [],
    currentWordIndex: 0,
    foundWords: new Set(),
    score: 0,
    combo: 0,
    maxCombo: 0,
    mistakes: 0,
    startTime: 0,
    elapsedTime: 0,
  });

  // Timer effect
  useEffect(() => {
    if (state.phase !== 'playing') return;

    const timer = setInterval(() => {
      setState((prev) => ({
        ...prev,
        elapsedTime: Date.now() - prev.startTime,
      }));
    }, 100);

    return () => clearInterval(timer);
  }, [state.phase]);

  const startGame = useCallback(
    (selected: Vocab[], mode: GameMode) => {
      const targetCount = GAME_MODE_COUNTS[mode];
      if (selected.length < targetCount) return;

      const wordsToUse = selected.slice(0, targetCount);
      // Shuffle word prompt order so each game is different
      const gameWords = [...wordsToUse].sort(() => Math.random() - 0.5);
      const selectedIds = new Set(wordsToUse.map((w) => w.id));

      const grid: GridCell[] = wordsToUse.map((word, index) => ({
        id: index,
        word,
        isTarget: selectedIds.has(word.id),
        state: 'idle' as const,
      }));

      // Shuffle grid cell positions independently
      for (let i = grid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [grid[i], grid[j]] = [grid[j], grid[i]];
      }

      grid.forEach((cell, idx) => {
        cell.id = idx;
      });

      setState({
        phase: 'playing',
        mode,
        selectedWords: wordsToUse,
        gameWords,
        grid,
        currentWordIndex: 0,
        foundWords: new Set(),
        score: 0,
        combo: 0,
        maxCombo: 0,
        mistakes: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      });
    },
    []
  );

  const selectCell = useCallback((cellId: number) => {
    setState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const cell = prev.grid.find((c) => c.id === cellId);
      if (!cell || cell.state === 'correct') return prev;

      const currentWord = prev.gameWords[prev.currentWordIndex];
      const isCorrect = cell.word.id === currentWord.id;

      const newGrid = prev.grid.map((c) => {
        if (c.id === cellId) {
          return { ...c, state: isCorrect ? ('correct' as const) : ('wrong' as const) };
        }
        return c;
      });

      if (isCorrect) {
        const newCombo = prev.combo + 1;
        const comboBonus = Math.floor(newCombo / 3) * COMBO_MULTIPLIER;
        const newScore = prev.score + POINTS_PER_CORRECT + comboBonus;
        const newFoundWords = new Set(prev.foundWords).add(currentWord.id);
        const nextIndex = prev.currentWordIndex + 1;

        if (nextIndex >= prev.gameWords.length) {
          return {
            ...prev,
            grid: newGrid,
            foundWords: newFoundWords,
            score: newScore,
            combo: newCombo,
            maxCombo: Math.max(prev.maxCombo, newCombo),
            phase: 'result',
          };
        }

        return {
          ...prev,
          grid: newGrid,
          currentWordIndex: nextIndex,
          foundWords: newFoundWords,
          score: newScore,
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
        };
      } else {
        setTimeout(() => {
          setState((s) => ({
            ...s,
            grid: s.grid.map((c) => (c.id === cellId && c.state === 'wrong' ? { ...c, state: 'idle' } : c)),
          }));
        }, 500);

        return {
          ...prev,
          grid: newGrid,
          combo: 0,
          mistakes: prev.mistakes + 1,
        };
      }
    });
  }, []);

  const skipWord = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const currentWord = prev.gameWords[prev.currentWordIndex];
      // Append skipped word to the end so it comes back later
      const newGameWords = [...prev.gameWords, currentWord];
      const nextIndex = prev.currentWordIndex + 1;

      return {
        ...prev,
        gameWords: newGameWords,
        currentWordIndex: nextIndex,
        combo: 0,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState({
      phase: 'setup',
      mode: '6x5',
      selectedWords: [],
      gameWords: [],
      grid: [],
      currentWordIndex: 0,
      foundWords: new Set(),
      score: 0,
      combo: 0,
      maxCombo: 0,
      mistakes: 0,
      startTime: 0,
      elapsedTime: 0,
    });
  }, []);

  const playAgain = useCallback(
    () => {
      setState((prev) => {
        if (prev.selectedWords.length > 0) {
          const targetCount = GAME_MODE_COUNTS[prev.mode];
          const wordsToUse = prev.selectedWords.slice(0, targetCount);
          const gameWords = [...wordsToUse].sort(() => Math.random() - 0.5);
          const selectedIds = new Set(wordsToUse.map((w) => w.id));

          const grid: GridCell[] = wordsToUse.map((word, index) => ({
            id: index,
            word,
            isTarget: selectedIds.has(word.id),
            state: 'idle' as const,
          }));

          for (let i = grid.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [grid[i], grid[j]] = [grid[j], grid[i]];
          }

          grid.forEach((cell, idx) => {
            cell.id = idx;
          });

          return {
            ...prev,
            phase: 'playing',
            gameWords,
            grid,
            currentWordIndex: 0,
            foundWords: new Set(),
            score: 0,
            combo: 0,
            maxCombo: 0,
            mistakes: 0,
            startTime: Date.now(),
            elapsedTime: 0,
          };
        }
        return prev;
      });
    },
    []
  );

  return {
    state,
    startGame,
    selectCell,
    skipWord,
    resetGame,
    playAgain,
  };
}



