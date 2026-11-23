import { useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!session?.user || !supabase) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (!cancelled) {
        setIsAdmin(!roleError && data?.role === 'admin');
        setLoading(false);
      }
    }
    verify();
    return () => { cancelled = true; };
  }, [session]);
  async function signIn(e: React.FormEvent) { e.preventDefault(); setError(''); if (!supabase) return; const { error: authError } = await supabase.auth.signInWithPassword({ email, password }); if (authError) setError(authError.message); }
  if (!isSupabaseConfigured || !supabase) return <section><h2>Admin sign-in unavailable</h2><p>Set Supabase URL and publishable/anon key in environment.</p></section>;
  if (loading) return <p>Checking session…</p>;
  if (isAdmin) return <>{children}<button onClick={() => supabase?.auth.signOut()}>Sign out</button></>;
  return <form onSubmit={signIn} style={{maxWidth:420,margin:'3rem auto',display:'grid',gap:12}}><h2>AFAR SPORTS LIVE · Admin Login</h2><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button type="submit">Sign in</button>{error && <p role="alert">{error}</p>}{session?.user && <p>Account signed in, but does not have admin permissions.</p>}</form>;
}
