import { supabase } from '../lib/supabase';

/**
 * API handler to get a random unremembered vocabulary word
 * This can be used by the Chrome Extension
 */
export async function getRandomUnrememberedWord(userId?: string) {
  try {
    // Query for unremembered words
    let query = supabase
      .from('vocab')
      .select('hanzi, pinyin, meaning');

    // If userId provided, filter by user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filter by unremembered memory bucket
    query = query.eq('memory_bucket', 'unremembered');

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      // If no unremembered words, get any word
      const { data: allData, error: allError } = await supabase
        .from('vocab')
        .select('hanzi, pinyin, meaning')
        .limit(100);

      if (allError || !allData || allData.length === 0) {
        return { 
          success: false, 
          error: 'No vocabulary words found' 
        };
      }

      // Return random word from all words
      const randomWord = allData[Math.floor(Math.random() * allData.length)];
      return { success: true, data: randomWord };
    }

    // Return random unremembered word
    const randomWord = data[Math.floor(Math.random() * data.length)];
    return { success: true, data: randomWord };

  } catch (err) {
    console.error('Error fetching random word:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}
