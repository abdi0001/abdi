import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type Standing = {
  competition_id: string;
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

export function useStandings(competitionId?: string) {
  const [standings, setStandings] = useState<Standing[]>([]);
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
      let query = supabase!.from('competition_standings').select('*').order('points', { ascending: false }).order('goal_difference', { ascending: false });
      if (competitionId) query = query.eq('competition_id', competitionId);
      const { data, error: fetchError } = await query;
      if (!alive) return;
      if (fetchError) setError(fetchError.message);
      else { setStandings((data ?? []) as Standing[]); setError(null); }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [competitionId]);

  return { standings, loading, error };
}
