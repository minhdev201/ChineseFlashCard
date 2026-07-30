export interface Vocab {
  id: string;
  user_id: string;
  hanzi: string;
  pinyin: string;
  hanviet: string | null;
  meaning: string;
  example: string | null;
  memory_bucket: MemoryBucket;
  srs_level: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  created_at: string;
}

export type MemoryBucket = 'flashcard' | 'unremembered' | 'temporary';

export interface AppState {
  user_id: string;
  streak_count: number;
  last_activity_date: string | null;
  total_reviews: number;
}

export interface ActivityLog {
  date: string;
  reviewed: number;
  added: number;
}

export type FlashcardSource = 'all' | MemoryBucket;

export type TabKey = 'flashcard' | 'unremembered' | 'temporary' | 'add' | 'list' | 'stats';
