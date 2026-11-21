import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;

export type MatchStatus = 'upcoming' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled';
export type LiveMatch = {
  id: string; competition_id: string; home_team_id: string; away_team_id: string;
  kickoff_at: string | null; venue: string | null; status: MatchStatus;
  home_score: number; away_score: number; minute: number | null; round_label: string | null;
  home_team?: { name: string; short_name: string | null };
  away_team?: { name: string; short_name: string | null };
};
