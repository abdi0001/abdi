import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, CalendarDays, ChevronRight, CircleDot, Clock3,
  Flag, House, Menu, Newspaper, Radio, Search, Shield,
  Sun, Trophy, Users, X, Zap
} from 'lucide-react';
import './style.css';
import { isSupabaseConfigured } from './lib/supabase';
import type { LiveMatch } from './lib/supabase';
import { useLiveMatches } from './hooks/useLiveMatches';
import { useStandings } from './hooks/useStandings';
import { useNews } from './hooks/useNews';
import { AdminAuthGate } from './components/AdminAuthGate';
import { AdminMatchManager } from './components/AdminMatchManager';
import { AdminNewsManager } from './components/AdminNewsManager';

// ---- Status mapping ----
type UIStatus = 'LIVE' | 'UPCOMING' | 'FT';
function toUIStatus(status: LiveMatch['status']): UIStatus {
  switch (status) {
    case 'live': return 'LIVE';
    case 'halftime': return 'LIVE';
    case 'finished': return 'FT';
    default: return 'UPCOMING';
  }
}
function toMinuteLabel(m: LiveMatch): string | undefined {
  if (m.status === 'live' && m.minute != null) return `${m.minute}'`;
  if (m.status === 'halftime') return 'HT';
  if (m.status === 'finished') return 'FT';
  return undefined;
}

// ---- Fallback demo data for when Supabase is not configured ----
const DEMO_MATCHES: LiveMatch[] = [
  { id: '1', competition_id: 'demo', home_team_id: 'h1', away_team_id: 'a1', kickoff_at: null, venue: 'Awash Stadium, Semera', status: 'live', home_score: 2, away_score: 1, minute: 67, round_label: 'Round 8', home_team: { name: 'Kilbati FC', short_name: 'KIL' }, away_team: { name: 'Semera United', short_name: 'SEM' } },
  { id: '2', competition_id: 'demo', home_team_id: 'h2', away_team_id: 'a2', kickoff_at: 'Oct 19 · 3:30 PM', venue: 'Awash Stadium', status: 'upcoming', home_score: 0, away_score: 0, minute: null, round_label: null, home_team: { name: 'Awash FC', short_name: 'AWA' }, away_team: { name: 'Dubti SC', short_name: 'DUB' } },
  { id: '3', competition_id: 'demo', home_team_id: 'h3', away_team_id: 'a3', kickoff_at: 'Oct 20 · 3:30 PM', venue: 'Mille Stadium', status: 'upcoming', home_score: 0, away_score: 0, minute: null, round_label: null, home_team: { name: 'Mille FC', short_name: 'MIL' }, away_team: { name: 'Chifra FC', short_name: 'CHI' } },
  { id: '5', competition_id: 'demo', home_team_id: 'h5', away_team_id: 'a5', kickoff_at: 'Oct 15, 2025', venue: 'Dalo Ground', status: 'finished', home_score: 2, away_score: 1, minute: null, round_label: null, home_team: { name: 'Dalo SC', short_name: 'DAL' }, away_team: { name: 'Afdera FC', short_name: 'AFD' } },
];

const DEMO_TEAMS = [
  ['Kilbati FC', 7, 5, 1, 1, '+9', 16],
  ['Semera United', 7, 4, 2, 1, '+7', 14],
  ['Dalol SC', 7, 4, 1, 2, '+5', 13],
  ['Afdera FC', 7, 3, 2, 2, '+1', 11],
  ['Logiya FC', 7, 3, 1, 3, '-1', 10],
];

const DEMO_NEWS = [
  { id: 'd1', title: 'Afar Regional Sports Commission launches new season', published_at: 'Oct 17, 2025', image_url: null, summary: null, published: true },
  { id: 'd2', title: 'Kilbati FC leads the league after week one', published_at: 'Oct 16, 2025', image_url: null, summary: null, published: true },
  { id: 'd3', title: 'Afar athletics championship kicks off in Semera', published_at: 'Oct 15, 2025', image_url: null, summary: null, published: true },
];

// ---- Helpers ----
const DEFAULT_COLORS: [string, string][] = [
  ['#b6d7a5', '#e6bc53'],
  ['#72c783', '#e47d32'],
  ['#79a6dc', '#e68731'],
  ['#8aa6cb', '#d45256'],
  ['#65ba83', '#d45454'],
];

function matchColors(idx: number): [string, string] {
  return DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
}

// ---- Crest component (unchanged) ----
function Crest({ name, colors, size = 42 }: { name: string; colors: string[]; size?: number }) {
  return (
    <div className="crest" style={{ width: size, height: size, background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})` }} aria-label={`${name} crest`}>
      <Shield size={size * 0.6} strokeWidth={1.7} />
      <span>{name.split(' ').map(w => w[0]).join('').slice(0, 3)}</span>
    </div>
  );
}

// ---- Loading skeleton ----
function MatchSkeleton() {
  return (
    <div className="featured-match" style={{opacity: 0.5}}>
      <div style={{background: '#333', borderRadius: 6, height: 20, width: '60%', margin: '0 auto 12px'}} />
      <div style={{display: 'flex', justifyContent: 'center', gap: 24}}>
        <div style={{background: '#333', borderRadius: 8, height: 66, width: 66}} />
        <div style={{background: '#333', borderRadius: 8, height: 66, width: 80}} />
        <div style={{background: '#333', borderRadius: 8, height: 66, width: 66}} />
      </div>
    </div>
  );
}

// ---- Main App ----
function App() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);

  // Real data from Supabase (or error when not configured)
  const { matches: liveMatches, loading: matchesLoading } = useLiveMatches();
  const { standings, loading: standingsLoading } = useStandings();
  const { articles, loading: newsLoading } = useNews();

  const supabaseConfigured = isSupabaseConfigured;

  // Use demo data when Supabase is not configured
  const matches = supabaseConfigured ? liveMatches : DEMO_MATCHES;
  const isLoading = supabaseConfigured && matchesLoading;

  // Map LiveMatch to UI display object
  type UIMatch = {
    id: string;
    home: string;
    away: string;
    homeScore: number;
    awayScore: number;
    status: UIStatus;
    minute?: string;
    date: string;
    venue: string;
    league: string;
    colors: [string, string];
    reverseColors: [string, string];
  };

  const uiMatches: UIMatch[] = matches.map((m, idx) => {
    const homeColor = (m.home_team as any)?.primary_color as string | undefined;
    const awayColor = (m.away_team as any)?.primary_color as string | undefined;
    const defColors = matchColors(idx);
    const hColors: [string, string] = homeColor ? [homeColor, homeColor + 'aa'] : defColors;
    const aColors: [string, string] = awayColor ? [awayColor, awayColor + 'aa'] : [defColors[1], defColors[0]];
    return {
      id: m.id,
      home: m.home_team?.name ?? m.home_team_id,
      away: m.away_team?.name ?? m.away_team_id,
      homeScore: m.home_score,
      awayScore: m.away_score,
      status: toUIStatus(m.status),
      minute: toMinuteLabel(m),
      date: m.kickoff_at ? new Date(m.kickoff_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD',
      venue: m.venue ?? 'Venue TBD',
      league: m.round_label ?? 'Afar Regional League',
      colors: hColors,
      reverseColors: aColors,
    };
  });

  const filtered = useMemo(
    () => uiMatches.filter(m =>
      (filter === 'All' || m.status === filter) &&
      `${m.home} ${m.away}`.toLowerCase().includes(search.toLowerCase())
    ),
    [uiMatches, filter, search]
  );

  // Standings: real or demo
  const standingsRows = supabaseConfigured && standings.length > 0
    ? standings.slice(0, 6).map(s => [s.team_name, s.played, s.won, s.drawn, s.lost, s.goal_difference >= 0 ? `+${s.goal_difference}` : String(s.goal_difference), s.points])
    : DEMO_TEAMS;

  // News: real or demo
  const newsItems = supabaseConfigured && articles.length > 0 ? articles : DEMO_NEWS;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandmark"><CircleDot /><span>⚽</span></div>
          <div><strong>AFAR <b>SPORTS LIVE</b></strong><small>Afar Regional Sports Commission</small></div>
        </div>
        <nav>
          <a className="active"><House />Home</a>
          <a href="#live"><Radio />Live</a>
          <a href="#matches"><CalendarDays />Matches</a>
          <a href="#standings"><Trophy />Standings</a>
          <a href="#teams"><Users />Teams</a>
          <a href="#news"><Newspaper />News</a>
        </nav>
        <div className="right-head">
          <div className="search">
            <Search size={15} />
            <input placeholder="Search teams..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="lang">EN</button>
          <button className="iconbtn"><Sun size={18} /></button>
          <button className="mobilemenu"><Menu /></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">2025/26 SEASON • REGIONAL COMPETITION</span>
            <h1>Afar Regional<br /><em>Football League</em></h1>
            <p>Follow every match, every goal, every moment.</p>
            <div className="hero-stats">
              <div><Users /><strong>16</strong><span>Teams</span></div>
              <div><Trophy /><strong>Round 8</strong><span>Current round</span></div>
              <div><CalendarDays /><strong>Oct 18</strong><span>Match day</span></div>
            </div>
            <div className="hero-buttons">
              <a className="btn-primary" href="#standings">View Standings <ChevronRight /></a>
              <a className="btn-outline" href="#live">Live Matches <Radio /></a>
            </div>
          </div>
          <div className="hero-tagline">Sport for a<br /><b>Stronger Afar.</b><span></span></div>
        </div>
      </section>

      {!supabaseConfigured && (
        <div style={{background: '#1a2a1a', border: '1px solid #3a5a3a', color: '#a0c8a0', padding: '12px 24px', textAlign: 'center', fontSize: 14}}>
          ⚡ Showing demo data — <strong>Connect Supabase to see live data.</strong> Copy <code>.env.example</code> to <code>.env.local</code> and add your project credentials.
        </div>
      )}

      <main className="dashboard">
        <div className="left-column">
          <section className="panel live-panel" id="live">
            <div className="panel-heading">
              <div>
                <span className="live-dot"></span>
                <h2>LIVE NOW</h2>
                <Radio className="lime" />
              </div>
              <div className="filters">
                {['All', 'LIVE', 'UPCOMING', 'FT'].map((f, i) => (
                  <button
                    key={f}
                    className={filter === (i === 0 ? 'All' : f) ? 'selected' : ''}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'FT' ? 'Finished' : f === 'UPCOMING' ? 'Upcoming' : f}
                  </button>
                ))}
              </div>
            </div>
            {isLoading ? (
              <MatchSkeleton />
            ) : (
              <>
                {filtered.filter(m => m.status === 'LIVE').map(m => (
                  <div className="featured-match" key={m.id}>
                    <div className="match-league"><Trophy size={17} />{m.league}<span className="minute">{m.minute}</span></div>
                    <div className="score-row">
                      <div className="team"><Crest name={m.home} colors={m.colors} size={66} /><strong>{m.home}</strong></div>
                      <div className="score"><strong>{m.homeScore} <i>–</i> {m.awayScore}</strong><span className="live-pill">● LIVE</span></div>
                      <div className="team"><Crest name={m.away} colors={m.reverseColors} size={66} /><strong>{m.away}</strong></div>
                    </div>
                    <div className="venue"><Flag size={15} />{m.venue}</div>
                  </div>
                ))}
                {filtered.filter(m => m.status === 'LIVE').length === 0 && (
                  <div className="empty">No live matches right now.</div>
                )}
              </>
            )}
          </section>

          <section className="panel upcoming" id="matches">
            <div className="panel-heading">
              <div><CalendarDays className="lime" /><h2>UPCOMING MATCHES</h2></div>
              <a href="#matches">View All <ChevronRight /></a>
            </div>
            <div className="fixture-grid">
              {filtered.filter(m => m.status === 'UPCOMING').map(m => (
                <article className="fixture" key={m.id}>
                  <span className="fixture-date">{m.date}</span>
                  <div className="fixture-teams">
                    <div><Crest name={m.home} colors={m.colors} size={38} /><strong>{m.home}</strong></div>
                    <b>VS</b>
                    <div><Crest name={m.away} colors={m.reverseColors} size={38} /><strong>{m.away}</strong></div>
                  </div>
                  <span className="fixture-venue"><Flag size={13} />{m.venue}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="panel news" id="news">
            <div className="panel-heading">
              <div><Newspaper className="lime" /><h2>SPORTS NEWS</h2></div>
              <a href="#news">View All <ChevronRight /></a>
            </div>
            <div className="news-grid">
              {newsLoading ? (
                [1, 2, 3].map(i => (
                  <article key={i}>
                    <div className="news-photo" style={{background: '#333', opacity: 0.5}}></div>
                    <strong style={{display: 'block', background: '#333', height: 16, borderRadius: 4, margin: '8px 0 4px'}}></strong>
                    <small style={{display: 'block', background: '#222', height: 12, borderRadius: 4, width: '60%'}}></small>
                  </article>
                ))
              ) : (
                newsItems.slice(0, 3).map((a, i) => (
                  <article key={a.id}>
                    {a.image_url
                      ? <img src={a.image_url} alt={a.title} className="news-photo" style={{objectFit: 'cover', width: '100%'}} />
                      : <div className={`news-photo photo${(i % 3) + 1}`}></div>
                    }
                    <strong>{a.title}</strong>
                    <small>{a.published_at ? new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</small>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="panel standings" id="standings">
            <div className="panel-heading">
              <div><Trophy className="lime" /><h2>LEAGUE STANDINGS</h2></div>
              <a href="#standings">More <ChevronRight /></a>
            </div>
            {standingsLoading && supabaseConfigured ? (
              <p style={{color: '#888', padding: 12}}>Loading standings…</p>
            ) : (
              <table>
                <thead>
                  <tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
                </thead>
                <tbody>
                  {standingsRows.slice(0, 5).map((t, i) => (
                    <tr className={i === 0 ? 'leader' : ''} key={String(t[0])}>
                      <td>{i + 1}</td>
                      <td>
                        <div className="table-team">
                          <Crest name={String(t[0])} colors={i === 0 ? ['#6eac8b', '#1d4736'] : ['#477da6', '#162b50']} size={22} />
                          {t[0]}
                        </div>
                      </td>
                      {(t as (string | number)[]).slice(1).map((v, j) => <td key={j}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <a className="table-link" href="#standings">View Full Table <ChevronRight /></a>
          </section>

          <section className="panel results">
            <div className="panel-heading">
              <div><Activity className="lime" /><h2>RECENT RESULTS</h2></div>
              <a href="#matches">View All <ChevronRight /></a>
            </div>
            {uiMatches.filter(m => m.status === 'FT').map(m => (
              <div className="result-row" key={m.id}>
                <small>{m.date}</small>
                <div>
                  <strong>{m.home}</strong>
                  <Crest name={m.home} colors={m.colors} size={24} />
                  <b>{m.homeScore} – {m.awayScore}</b>
                  <Crest name={m.away} colors={m.reverseColors} size={24} />
                  <strong>{m.away}</strong>
                </div>
              </div>
            ))}
          </section>

          <section className="promo">
            <div className="promo-art"></div>
            <div>
              <strong>Afar Regional<br />Sports Commission</strong>
              <p>Developing sports.<br />Building a healthy society.</p>
            </div>
          </section>

          <section className="admin-box">
            <button onClick={() => setAdminOpen(!adminOpen)}>
              <Zap size={16} />
              {adminOpen ? 'Close Admin Panel' : 'Open Admin Panel'}
              <ChevronRight />
            </button>
            {adminOpen && (
              isSupabaseConfigured
                ? (
                  <AdminAuthGate>
                    <AdminMatchManager />
                    <AdminNewsManager />
                  </AdminAuthGate>
                )
                : (
                  <div className="admin-console">
                    <h3>ADMIN PANEL</h3>
                    <p className="admin-note">Admin panel requires Supabase. Copy <code>.env.example</code> to <code>.env.local</code> and add your Supabase credentials.</p>
                  </div>
                )
            )}
          </section>
        </aside>
      </main>

      <footer>
        <div className="brand footer-brand">
          <div className="brandmark"><CircleDot /><span>⚽</span></div>
          <div><strong>AFAR <b>SPORTS LIVE</b></strong><small>Afar Regional Sports Commission</small></div>
        </div>
        <div className="footer-links">
          <a>About Us</a><a>Contact</a><a>Privacy Policy</a><a>Terms of Use</a>
        </div>
        <div className="copyright">© 2025 Afar Regional Sports Commission</div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
