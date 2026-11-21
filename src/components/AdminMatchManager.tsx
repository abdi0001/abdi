import React, { useState } from 'react';
import { ChevronRight, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type LiveMatch } from '../lib/supabase';
import { useLiveMatches } from '../hooks/useLiveMatches';

export function AdminMatchManager() {
  const { matches } = useLiveMatches();
  const [adminTab, setAdminTab] = useState<'overview' | 'matches'>('overview');
  const [newHome, setNewHome] = useState('');
  const [newAway, setNewAway] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  const updateMatchStatus = async (id: string, status: LiveMatch['status']) => {
    if (!supabase) return;
    const updates: Record<string, unknown> = { status };
    if (status === 'live') updates.minute = 1;
    if (status === 'finished') updates.minute = null;
    const { error } = await supabase.from('matches').update(updates).eq('id', id);
    if (error) setAdminMessage('Error: ' + error.message);
    else setAdminMessage('Match updated.');
  };

  const createFixture = async () => {
    if (!newHome.trim() || !newAway.trim()) { setAdminMessage('Enter both team names.'); return; }
    if (!supabase) { setAdminMessage('Supabase not configured.'); return; }
    // For a real app you'd look up team IDs; for now we insert with placeholder team IDs
    setAdminMessage('Fixture creation requires team IDs from the database. Use the Supabase dashboard to create fixtures, or add team selection dropdowns.');
    setNewHome(''); setNewAway(''); setNewDate(''); setNewVenue('');
  };

  return (
    <div className="admin-console">
      <h3>ADMIN · MATCH MANAGER</h3>
      <div className="admin-tabs">
        {(['overview', 'matches'] as const).map(tab => (
          <button className={adminTab === tab ? 'active' : ''} key={tab} onClick={() => setAdminTab(tab)}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {adminMessage && <div className="admin-status">{adminMessage}</div>}
      {adminTab === 'overview' && (
        <>
          <p className="admin-note">Live match management connected to Supabase.</p>
          <div className="admin-item"><span>Matches total</span><strong>{matches.length}</strong></div>
          <div className="admin-item"><span>Live now</span><strong>{matches.filter(m => m.status === 'live').length}</strong></div>
          <div className="admin-item"><span>Upcoming</span><strong>{matches.filter(m => m.status === 'upcoming').length}</strong></div>
          <button className="admin-action primary" onClick={() => setAdminTab('matches')}>Manage matches</button>
        </>
      )}
      {adminTab === 'matches' && (
        <>
          <div className="admin-form">
            <input placeholder="Home team name" value={newHome} onChange={e => setNewHome(e.target.value)} />
            <input placeholder="Away team name" value={newAway} onChange={e => setNewAway(e.target.value)} />
            <input placeholder="Date / kickoff" value={newDate} onChange={e => setNewDate(e.target.value)} />
            <input placeholder="Venue" value={newVenue} onChange={e => setNewVenue(e.target.value)} />
            <button className="admin-action primary wide" onClick={createFixture}>Create fixture</button>
          </div>
          {matches.map(m => (
            <div className="admin-item" key={m.id}>
              <span>{m.home_team?.name ?? m.home_team_id} vs {m.away_team?.name ?? m.away_team_id}<small> · {m.status}</small></span>
              <div className="admin-item-controls">
                <button onClick={() => updateMatchStatus(m.id, 'live')}>Live</button>
                <button onClick={() => updateMatchStatus(m.id, 'finished')}>Finish</button>
                <button onClick={() => updateMatchStatus(m.id, 'upcoming')}>Reset</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
