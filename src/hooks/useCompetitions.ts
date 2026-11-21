import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type Competition = {
  id: string;
  name: string;
  season: string;
  sport: string;
  region: string | null;
  status: string;
};

export function useCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
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
      const { data, error: fetchError } = await supabase!.from('competitions').select('*').eq('status', 'active').order('name', { ascending: true });
      if (!alive) return;
      if (fetchError) setError(fetchError.message);
      else { setCompetitions((data ?? []) as Competition[]); setError(null); }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, []);

  return { competitions, loading, error };
}
