import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vocab } from './types';

export const PINYIN_GAME_TIME_LIMIT = 15;

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export interface PinyinGameQuestion {
  word: Vocab;
  userAnswer: string;
  status: 'pending' | 'correct' | 'wrong' | 'skipped';
  revealedHints: number;
}

export interface PinyinGameState {
  phase: 'setup' | 'playing' | 'result';
  targetCount: number;
  timePressure: boolean;
  questions: PinyinGameQuestion[];
  currentIndex: number;
  score: number;
  combo: number;
  maxCombo: number;
  mistakes: number;
  startTime: number;
  elapsedTime: number;
  timeLeft: number;
  currentInput: string;
  feedback: 'none' | 'correct' | 'wrong';
}

export function usePinyinGame() {
  const [state, setState] = useState<PinyinGameState>({
    phase: 'setup',
    targetCount: 10,
    timePressure: false,
    questions: [],
    currentIndex: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    mistakes: 0,
    startTime: 0,
    elapsedTime: 0,
    timeLeft: PINYIN_GAME_TIME_LIMIT,
    currentInput: '',
    feedback: 'none',
  });

  const timerRef = useRef<number | null>(null);

  // Elapsed time tracker during playing phase
  useEffect(() => {
    if (state.phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = window.setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'playing') return prev;
        return {
          ...prev,
          elapsedTime: Date.now() - prev.startTime,
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [state.phase]);

  // Countdown timer for timePressure mode
  useEffect(() => {
    if (state.phase !== 'playing' || !state.timePressure) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'playing' || !prev.timePressure) return prev;
        if (prev.timeLeft <= 1) {
          // Time expired for current word: mark skipped/wrong and advance
          const updatedQuestions = [...prev.questions];
          updatedQuestions[prev.currentIndex] = {
            ...updatedQuestions[prev.currentIndex],
            status: 'wrong',
            userAnswer: prev.currentInput || '(Hết giờ)',
          };

          const nextIndex = prev.currentIndex + 1;
          if (nextIndex >= prev.questions.length) {
            return {
              ...prev,
              phase: 'result',
              questions: updatedQuestions,
              mistakes: prev.mistakes + 1,
              combo: 0,
              feedback: 'none',
            };
          }

          return {
            ...prev,
            questions: updatedQuestions,
            currentIndex: nextIndex,
            currentInput: '',
            feedback: 'none',
            timeLeft: PINYIN_GAME_TIME_LIMIT,
            mistakes: prev.mistakes + 1,
            combo: 0,
          };
        }

        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase, state.timePressure, state.currentIndex]);

  const startGame = useCallback(
    (selectedWords: Vocab[], count: number, timePressure: boolean) => {
      const shuffledPool = shuffleArray(selectedWords);
      const chosen = shuffledPool.slice(0, Math.min(count, selectedWords.length));
      const finalShuffled = shuffleArray(chosen);

      const questions: PinyinGameQuestion[] = finalShuffled.map((word) => ({
        word,
        userAnswer: '',
        status: 'pending',
        revealedHints: 0,
      }));

      setState({
        phase: 'playing',
        targetCount: chosen.length,
        timePressure,
        questions,
        currentIndex: 0,
        score: 0,
        combo: 0,
        maxCombo: 0,
        mistakes: 0,
        startTime: Date.now(),
        elapsedTime: 0,
        timeLeft: PINYIN_GAME_TIME_LIMIT,
        currentInput: '',
        feedback: 'none',
      });
    },
    []
  );

  const checkAnswer = useCallback(
    (rawInput: string) => {
      const trimmed = rawInput.trim();
      const currentQ = state.questions[state.currentIndex];
      if (!currentQ) return { isCorrect: false, points: 0, combo: 0 };

      const targetHanzi = currentQ.word.hanzi.trim();
      const isMatch = trimmed === targetHanzi;

      if (isMatch) {
        const newCombo = state.combo + 1;
        const comboBonus = Math.floor(newCombo / 3) * 2;
        const pointsAwarded = 10 + comboBonus;

        const updatedQuestions = [...state.questions];
        updatedQuestions[state.currentIndex] = {
          ...currentQ,
          userAnswer: trimmed,
          status: 'correct',
        };

        setState((prev) => ({
          ...prev,
          questions: updatedQuestions,
          score: prev.score + pointsAwarded,
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
          feedback: 'correct',
        }));

        return { isCorrect: true, points: pointsAwarded, combo: newCombo };
      } else {
        setState((prev) => ({
          ...prev,
          combo: 0,
          mistakes: prev.mistakes + 1,
          feedback: 'wrong',
        }));

        return { isCorrect: false, points: 0, combo: 0 };
      }
    },
    [state.questions, state.currentIndex, state.combo]
  );

  const advanceNext = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return {
          ...prev,
          phase: 'result',
          feedback: 'none',
        };
      }

      return {
        ...prev,
        currentIndex: nextIndex,
        currentInput: '',
        feedback: 'none',
        timeLeft: PINYIN_GAME_TIME_LIMIT,
      };
    });
  }, []);

  const skipQuestion = useCallback(() => {
    setState((prev) => {
      const updatedQuestions = [...prev.questions];
      const currentQ = updatedQuestions[prev.currentIndex];
      if (currentQ) {
        updatedQuestions[prev.currentIndex] = {
          ...currentQ,
          status: 'skipped',
          userAnswer: prev.currentInput || '(Bỏ qua)',
        };
      }

      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return {
          ...prev,
          phase: 'result',
          questions: updatedQuestions,
          combo: 0,
          feedback: 'none',
        };
      }

      return {
        ...prev,
        questions: updatedQuestions,
        currentIndex: nextIndex,
        currentInput: '',
        feedback: 'none',
        timeLeft: PINYIN_GAME_TIME_LIMIT,
        combo: 0,
      };
    });
  }, []);

  const giveHint = useCallback(() => {
    setState((prev) => {
      const currentQ = prev.questions[prev.currentIndex];
      if (!currentQ) return prev;

      const target = currentQ.word.hanzi;
      const currentLen = prev.currentInput.length;
      if (currentLen >= target.length) return prev;

      const nextChar = target[currentLen];
      const newInput = prev.currentInput + nextChar;

      const updatedQuestions = [...prev.questions];
      updatedQuestions[prev.currentIndex] = {
        ...currentQ,
        revealedHints: currentQ.revealedHints + 1,
      };

      return {
        ...prev,
        currentInput: newInput,
        questions: updatedQuestions,
        feedback: 'none',
      };
    });
  }, []);

  const setInput = useCallback((val: string) => {
    setState((prev) => ({
      ...prev,
      currentInput: val,
      feedback: prev.feedback === 'wrong' ? 'none' : prev.feedback,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState({
      phase: 'setup',
      targetCount: 10,
      timePressure: false,
      questions: [],
      currentIndex: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      mistakes: 0,
      startTime: 0,
      elapsedTime: 0,
      timeLeft: PINYIN_GAME_TIME_LIMIT,
      currentInput: '',
      feedback: 'none',
    });
  }, []);

  const playAgain = useCallback(() => {
    setState((prev) => {
      const words = prev.questions.map((q) => q.word);
      const shuffled = shuffleArray(words);
      const questions: PinyinGameQuestion[] = shuffled.map((word) => ({
        word,
        userAnswer: '',
        status: 'pending',
        revealedHints: 0,
      }));

      return {
        ...prev,
        phase: 'playing',
        questions,
        currentIndex: 0,
        score: 0,
        combo: 0,
        maxCombo: 0,
        mistakes: 0,
        startTime: Date.now(),
        elapsedTime: 0,
        timeLeft: PINYIN_GAME_TIME_LIMIT,
        currentInput: '',
        feedback: 'none',
      };
    });
  }, []);

  return {
    state,
    startGame,
    checkAnswer,
    advanceNext,
    skipQuestion,
    giveHint,
    setInput,
    resetGame,
    playAgain,
  };
}
