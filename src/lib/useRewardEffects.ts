/**
 * useRewardEffects – state & trigger helpers for reward visual effects.
 * Kept in a separate file so RewardEffects.tsx only exports components
 * (satisfying react-refresh/only-export-components).
 */
import { useCallback, useRef, useState } from 'react';
import { playCorrectSound, playComboMilestoneSound } from './soundEffects';

interface BurstData { id: number; x: number; y: number; }
interface ScorePopupData { id: number; x: number; y: number; points: number; combo: number; }

export type { BurstData, ScorePopupData };

let _nextId = 0;
const nextId = () => ++_nextId;

const COMBO_MILESTONES = [3, 5, 7, 10, 15, 20, 25, 30];

export function useRewardEffects() {
  const [bursts, setBursts] = useState<BurstData[]>([]);
  const [popups, setPopups] = useState<ScorePopupData[]>([]);
  const [comboFlashKey, setComboFlashKey] = useState(0);
  const [comboForFlash, setComboForFlash] = useState(0);
  const lastMilestoneRef = useRef(0);

  const triggerCorrect = useCallback(
    (clientX: number, clientY: number, points: number, combo: number) => {
      setBursts((prev) => [...prev, { id: nextId(), x: clientX, y: clientY }]);
      setPopups((prev) => [...prev, { id: nextId(), x: clientX, y: clientY - 24, points, combo }]);

      if (COMBO_MILESTONES.includes(combo) && combo !== lastMilestoneRef.current) {
        lastMilestoneRef.current = combo;
        setComboForFlash(combo);
        setComboFlashKey((k) => k + 1);
        playComboMilestoneSound(combo);
      } else {
        playCorrectSound(combo);
      }
    },
    []
  );

  const removeBurst = useCallback((id: number) => setBursts((p) => p.filter((b) => b.id !== id)), []);
  const removePopup = useCallback((id: number) => setPopups((p) => p.filter((x) => x.id !== id)), []);
  const resetEffects = useCallback(() => {
    setBursts([]); setPopups([]); lastMilestoneRef.current = 0;
  }, []);

  return { bursts, popups, comboFlashKey, comboForFlash, triggerCorrect, removeBurst, removePopup, resetEffects };
}

