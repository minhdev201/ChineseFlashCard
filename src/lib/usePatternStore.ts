import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { GrammarPattern, PatternExample } from './types';

export function usePatternStore(user: User | null) {
  const [patterns, setPatterns] = useState<GrammarPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoaded = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('grammar_patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching patterns:', error);
      return;
    }

    const formatted: GrammarPattern[] = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      pattern: row.pattern,
      meaning: row.meaning,
      note: row.note || null,
      examples: Array.isArray(row.examples) ? row.examples : [],
      created_at: row.created_at,
    }));

    setPatterns(formatted);
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
        await refresh();
        initialLoaded.current = true;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, refresh]);

  const addPattern = useCallback(
    async (input: {
      pattern: string;
      meaning: string;
      note?: string | null;
      examples: PatternExample[];
    }) => {
      if (!user) throw new Error('No user logged in');
      const { data, error } = await supabase
        .from('grammar_patterns')
        .insert({
          user_id: user.id,
          pattern: input.pattern.trim(),
          meaning: input.meaning.trim(),
          note: input.note?.trim() || null,
          examples: input.examples || [],
        })
        .select('*')
        .single();

      if (error) throw error;
      await refresh();
      return data as GrammarPattern;
    },
    [user, refresh]
  );

  const updatePattern = useCallback(
    async (
      id: string,
      patch: {
        pattern?: string;
        meaning?: string;
        note?: string | null;
        examples?: PatternExample[];
      }
    ) => {
      if (!user) throw new Error('No user logged in');
      const allowed: Record<string, unknown> = {};
      if (patch.pattern !== undefined) allowed.pattern = patch.pattern.trim();
      if (patch.meaning !== undefined) allowed.meaning = patch.meaning.trim();
      if (patch.note !== undefined) allowed.note = patch.note?.trim() || null;
      if (patch.examples !== undefined) allowed.examples = patch.examples;

      const { error } = await supabase
        .from('grammar_patterns')
        .update(allowed)
        .eq('id', id);

      if (error) throw error;
      await refresh();
    },
    [user, refresh]
  );

  const deletePattern = useCallback(
    async (id: string) => {
      if (!user) throw new Error('No user logged in');
      const { error } = await supabase
        .from('grammar_patterns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refresh();
    },
    [user, refresh]
  );

  return {
    patterns,
    loading,
    refresh,
    addPattern,
    updatePattern,
    deletePattern,
  };
}
