import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type NewsArticle = {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  published: boolean;
  published_at: string | null;
};

export function useNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      setError('Supabase not configured');
      return;
    }
    let alive = true;
    const load = async () => {
      const { data, error: fetchError } = await supabase!.from('news').select('*').eq('published', true).order('published_at', { ascending: false });
      if (!alive) return;
      if (fetchError) setError(fetchError.message);
      else { setArticles((data ?? []) as NewsArticle[]); setError(null); }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, []);

  return { articles, loading, error };
}
