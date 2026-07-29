import type { ReviewRating, SrsResult, Vocab } from './types';

const DAY = 24 * 60 * 60 * 1000;

const todayStr = () => new Date().toISOString().slice(0, 10);

const addDays = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function applySrs(vocab: Vocab, rating: ReviewRating): SrsResult {
  let { srs_level, ease_factor, interval_days, repetitions, lapses } = vocab;

  if (rating === 'again') {
    repetitions = 0;
    lapses += 1;
    srs_level = Math.max(0, srs_level - 1);
    ease_factor = Math.max(1.3, ease_factor - 0.2);
    interval_days = 0;
    return {
      srs_level,
      ease_factor: Math.round(ease_factor * 100) / 100,
      interval_days,
      repetitions,
      lapses,
      next_review_at: todayStr(),
      last_reviewed_at: todayStr(),
    };
  }

  let delta = 0;
  if (rating === 'hard') {
    ease_factor = Math.max(1.3, ease_factor - 0.15);
    delta = 0;
  } else if (rating === 'good') {
    ease_factor = Math.max(1.3, Math.min(3.0, ease_factor + 0.0));
    delta = 1;
  } else if (rating === 'easy') {
    ease_factor = Math.max(1.3, Math.min(3.0, ease_factor + 0.15));
    delta = 2;
  }

  repetitions += 1;
  srs_level = Math.min(5, srs_level + delta);

  if (repetitions === 1) interval_days = 1;
  else if (repetitions === 2) interval_days = 3;
  else if (repetitions === 3) interval_days = 7;
  else if (repetitions === 4) interval_days = 14;
  else interval_days = Math.max(1, Math.round(interval_days * ease_factor));

  if (rating === 'hard') interval_days = Math.max(1, Math.round(interval_days * 0.7));
  if (rating === 'easy') interval_days = Math.round(interval_days * 1.3);

  return {
    srs_level,
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    lapses,
    next_review_at: addDays(interval_days),
    last_reviewed_at: todayStr(),
  };
}

export function isDue(vocab: Vocab): boolean {
  const today = todayStr();
  return vocab.next_review_at <= today;
}

export function masteryLabel(level: number): string {
  if (level === 0) return 'Mới';
  if (level <= 2) return 'Đang học';
  if (level <= 4) return 'Đã thuộc';
  return 'Ghi nhớ sâu';
}

export function masteryColor(level: number): string {
  if (level === 0) return 'text-slate-500 bg-slate-100';
  if (level <= 2) return 'text-amber-700 bg-amber-100';
  if (level <= 4) return 'text-blue-700 bg-blue-100';
  return 'text-emerald-700 bg-emerald-100';
}

export { DAY, todayStr, addDays };
