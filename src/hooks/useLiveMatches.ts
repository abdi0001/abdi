import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase, type LiveMatch } from '../lib/supabase';

export function useLiveMatches(competitionId?: string) {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) { setLoading(false); setError('Supabase is not configured. Add environment variables.'); return; }
    let alive = true;
    const load = async () => {
      let query = supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(name,short_name), away_team:teams!matches_away_team_id_fkey(name,short_name)').order('kickoff_at', { ascending: true });
      if (competitionId) query = query.eq('competition_id', competitionId);
      const { data, error: fetchError } = await query;
      if (!alive) return;
      if (fetchError) setError(fetchError.message); else { setMatches((data ?? []) as LiveMatch[]); setError(null); }
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel(`public-live-matches-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [competitionId]);
  return { matches, loading, error };
}
