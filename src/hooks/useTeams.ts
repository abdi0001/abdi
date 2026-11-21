import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type Team = {
  id: string;
  competition_id: string;
  name: string;
  short_name: string | null;
  zone: string | null;
  logo_url: string | null;
  primary_color: string | null;
};

export function useTeams(competitionId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
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
      let query = supabase!.from('teams').select('*').order('name', { ascending: true });
      if (competitionId) query = query.eq('competition_id', competitionId);
      const { data, error: fetchError } = await query;
      if (!alive) return;
      if (fetchError) setError(fetchError.message);
      else { setTeams((data ?? []) as Team[]); setError(null); }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [competitionId]);

  return { teams, loading, error };
}
