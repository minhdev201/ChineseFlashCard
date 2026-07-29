import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { ActivityLog, AppState, ReviewRating, Vocab } from './types';
import { applySrs, todayStr } from './srs';
import { SEED_WORDS } from './seedData';

const today = () => new Date().toISOString().slice(0, 10);

async function ensureAppState(userId: string) {
  const { data: existing } = await supabase
    .from('app_state')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!existing) {
    await supabase.from('app_state').insert({
      streak_count: 0,
      last_activity_date: null,
      total_reviews: 0,
    });
  }
}

async function seedIfEmpty() {
  const { count } = await supabase.from('vocab').select('*', { count: 'exact', head: true });
  if ((count ?? 0) === 0) {
    const rows = SEED_WORDS.map((w) => ({
      hanzi: w.hanzi,
      pinyin: w.pinyin,
      hanviet: w.hanviet,
      meaning: w.meaning,
      example: w.example,
    }));
    await supabase.from('vocab').insert(rows);
  }
}

async function bumpActivity(kind: 'reviewed' | 'added') {
  const date = today();
  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  if (data) {
    await supabase
      .from('activity_log')
      .update({ [kind]: (data[kind] || 0) + 1 })
      .eq('date', date);
  } else {
    await supabase.from('activity_log').insert({ date, reviewed: 0, added: 0, [kind]: 1 });
  }
}

async function bumpStreak() {
  const { data: state } = await supabase.from('app_state').select('*').maybeSingle();
  const s = (state || {}) as Partial<AppState>;
  const last = s.last_activity_date;
  const t = today();
  if (last === t) return;
  let newStreak = 1;
  if (last) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last === yesterday) newStreak = (s.streak_count || 0) + 1;
  }
  await supabase
    .from('app_state')
    .update({ streak_count: newStreak, last_activity_date: t });
}

export function useVocabStore(user: User | null) {
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const seeded = useRef(false);

  const refresh = useCallback(async () => {
    const [{ data: v }, { data: st }, { data: act }] = await Promise.all([
      supabase.from('vocab').select('*').order('created_at', { ascending: true }),
      supabase.from('app_state').select('*').maybeSingle(),
      supabase.from('activity_log').select('*').order('date', { ascending: true }),
    ]);
    setVocab((v as Vocab[]) || []);
    setStreak((st as AppState)?.streak_count || 0);
    setTotalReviews((st as AppState)?.total_reviews || 0);
    setActivity((act as ActivityLog[]) || []);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await ensureAppState(user.id);
        if (!seeded.current) {
          await seedIfEmpty();
          seeded.current = true;
        }
        if (cancelled) return;
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, refresh]);

  const addVocab = useCallback(
    async (input: Pick<Vocab, 'hanzi' | 'pinyin' | 'hanviet' | 'meaning' | 'example'>) => {
      const { data, error } = await supabase
        .from('vocab')
        .insert({
          hanzi: input.hanzi,
          pinyin: input.pinyin,
          hanviet: input.hanviet || null,
          meaning: input.meaning,
          example: input.example || null,
        })
        .select('*')
        .single();
      if (error) throw error;
      await bumpActivity('added');
      await bumpStreak();
      await refresh();
      return data as Vocab;
    },
    [refresh]
  );

  const updateVocab = useCallback(
    async (id: string, patch: Partial<Vocab>) => {
      const allowed: Record<string, unknown> = {};
      for (const k of ['hanzi', 'pinyin', 'hanviet', 'meaning', 'example']) {
        if (k in patch) allowed[k] = patch[k as keyof Vocab];
      }
      const { error } = await supabase.from('vocab').update(allowed).eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [refresh]
  );

  const deleteVocab = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('vocab').delete().eq('id', id);
      if (error) throw error;
      await refresh();
    },
    [refresh]
  );

  const reviewVocab = useCallback(
    async (id: string, rating: ReviewRating) => {
      const card = vocab.find((c) => c.id === id);
      if (!card) return;
      const result = applySrs(card, rating);
      const { error } = await supabase.from('vocab').update(result).eq('id', id);
      if (error) throw error;
      await supabase
        .from('app_state')
        .update({ total_reviews: totalReviews + 1 });
      await bumpActivity('reviewed');
      await bumpStreak();
      await refresh();
    },
    [vocab, totalReviews, refresh]
  );

  const findDuplicate = useCallback(
    (hanzi: string) => vocab.find((c) => c.hanzi === hanzi.trim()),
    [vocab]
  );

  return {
    vocab,
    loading,
    streak,
    totalReviews,
    activity,
    refresh,
    addVocab,
    updateVocab,
    deleteVocab,
    reviewVocab,
    findDuplicate,
  };
}
