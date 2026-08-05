import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { ActivityLog, AppState, MemoryBucket, Vocab } from './types';
import { todayStr } from './srs';
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
      user_id: userId,
      streak_count: 0,
      last_activity_date: null,
      total_reviews: 0,
    });
  }
}

async function seedIfEmpty(userId: string) {
  const { count } = await supabase.from('vocab').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  if ((count ?? 0) === 0) {
    const rows = SEED_WORDS.map((w) => ({
      user_id: userId,
      hanzi: w.hanzi,
      pinyin: w.pinyin,
      hanviet: w.hanviet,
      meaning: w.meaning,
      example: w.example,
      memory_bucket: 'flashcard',
    }));
    await supabase.from('vocab').insert(rows);
  }
}

async function bumpActivity(userId: string, kind: 'reviewed' | 'added') {
  const date = today();
  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (data) {
    await supabase
      .from('activity_log')
      .update({ [kind]: (data[kind] || 0) + 1 })
      .eq('id', data.id);
  } else {
    await supabase.from('activity_log').insert({ user_id: userId, date, reviewed: 0, added: 0, [kind]: 1 });
  }
}

async function bumpStreak(userId: string) {
  const { data: state } = await supabase.from('app_state').select('*').eq('user_id', userId).maybeSingle();
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
    .update({ streak_count: newStreak, last_activity_date: t })
    .eq('user_id', userId);
}

export function useVocabStore(user: User | null) {
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const seeded = useRef(false);
  const initialLoaded = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [{ data: v }, { data: st }, { data: act }] = await Promise.all([
      supabase.from('vocab').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('app_state').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('activity_log').select('*').eq('user_id', user.id).order('date', { ascending: true }),
    ]);
    setVocab((v as Vocab[]) || []);
    setStreak((st as AppState)?.streak_count || 0);
    setTotalReviews((st as AppState)?.total_reviews || 0);
    setActivity((act as ActivityLog[]) || []);
  }, [user]);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      initialLoaded.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      if (!initialLoaded.current) {
        setLoading(true);
      }
      try {
        await ensureAppState(userId);
        if (!seeded.current) {
          await seedIfEmpty(userId);
          seeded.current = true;
        }
        if (cancelled) return;
        await refresh();
        initialLoaded.current = true;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, refresh]);

  const addVocab = useCallback(
    async (input: Pick<Vocab, 'hanzi' | 'pinyin' | 'hanviet' | 'meaning' | 'example'>) => {
      if (!user) throw new Error('No user logged in');
      const { data, error } = await supabase
        .from('vocab')
        .insert({
          user_id: user.id,
          hanzi: input.hanzi,
          pinyin: input.pinyin,
          hanviet: input.hanviet || null,
          meaning: input.meaning,
          example: input.example || null,
          memory_bucket: 'flashcard',
        })
        .select('*')
        .single();
      if (error) throw error;
      await bumpActivity(user.id, 'added');
      await bumpStreak(user.id);
      await refresh();
      return data as Vocab;
    },
    [user, refresh]
  );

  const updateVocab = useCallback(
    async (id: string, patch: Partial<Vocab>) => {
      const allowed: Record<string, unknown> = {};
      for (const k of ['hanzi', 'pinyin', 'hanviet', 'meaning', 'example', 'memory_bucket']) {
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

  const setMemoryBucket = useCallback(
    async (id: string, memoryBucket: MemoryBucket) => {
      if (!user) return;
      const card = vocab.find((c) => c.id === id);
      if (!card) return;
      const { error } = await supabase
        .from('vocab')
        .update({
          memory_bucket: memoryBucket,
          last_reviewed_at: todayStr(),
        })
        .eq('id', id);
      if (error) throw error;
      await supabase
        .from('app_state')
        .update({ total_reviews: totalReviews + 1 })
        .eq('user_id', user.id);
      await bumpActivity(user.id, 'reviewed');
      await bumpStreak(user.id);
      await refresh();
    },
    [user, vocab, totalReviews, refresh]
  );

  const recordReview = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('app_state')
      .update({ total_reviews: totalReviews + 1 })
      .eq('user_id', user.id);
    await bumpActivity(user.id, 'reviewed');
    await bumpStreak(user.id);
    await refresh();
  }, [user, totalReviews, refresh]);

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
    setMemoryBucket,
    recordReview,
    findDuplicate,
  };
}
