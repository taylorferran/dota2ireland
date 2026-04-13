import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const emptyPlayer = () => ({ name: '', dotabuff: '' });

const Rebooted2Admin = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth state
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Per-team saving state: { [seed]: boolean }
  const [saving, setSaving] = useState({});
  // Per-team save result: { [seed]: 'ok' | 'error' }
  const [saveResult, setSaveResult] = useState({});

  useEffect(() => {
    supabase
      .from('rebooted2_teams')
      .select('*')
      .order('seed')
      .then(({ data, error }) => {
        if (error) console.error('Failed to load teams:', error);
        if (data) {
          // Ensure all 10 seeds exist, filling gaps with empty placeholders
          const byKey = Object.fromEntries(data.map(t => [t.seed, t]));
          const full = Array.from({ length: 10 }, (_, i) => {
            const seed = i + 1;
            return byKey[seed] ?? { seed, name: '', logo_url: '', players: [] };
          });
          setTeams(full);
        }
        setLoading(false);
      });
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setUnlocking(true);
    setPasswordError('');
    try {
      const testTeam = teams[0] ?? { seed: 1, name: '', logo_url: '', players: [] };
      const res = await fetch('/api/rebooted2-teams-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput, team: testTeam }),
      });
      if (res.ok) {
        setAdminPassword(passwordInput);
        setPasswordInput('');
        setIsUnlocked(true);
      } else if (res.status === 401) {
        // Server definitively rejected the password
        setPasswordError('Incorrect password');
      } else {
        // Non-auth server error (e.g. dev proxy sending to wrong target) — fall back to VITE var
        const devPassword = import.meta.env.VITE_REBOOTED2_ADMIN_PASSWORD;
        if (devPassword && passwordInput === devPassword) {
          setAdminPassword(passwordInput);
          setPasswordInput('');
          setIsUnlocked(true);
        } else {
          setPasswordError('Incorrect password');
        }
      }
    } catch {
      // Network error (dev proxy) — same fallback
      const devPassword = import.meta.env.VITE_REBOOTED2_ADMIN_PASSWORD;
      if (devPassword && passwordInput === devPassword) {
        setAdminPassword(passwordInput);
        setPasswordInput('');
        setIsUnlocked(true);
      } else {
        setPasswordError('Incorrect password');
      }
    } finally {
      setUnlocking(false);
    }
  };

  const updateTeamField = (seed, field, value) => {
    setTeams(prev =>
      prev.map(t => (t.seed === seed ? { ...t, [field]: value } : t))
    );
  };

  const updatePlayer = (seed, playerIdx, field, value) => {
    setTeams(prev =>
      prev.map(t => {
        if (t.seed !== seed) return t;
        const players = t.players.map((p, i) =>
          i === playerIdx ? { ...p, [field]: value } : p
        );
        return { ...t, players };
      })
    );
  };

  const addPlayer = (seed) => {
    setTeams(prev =>
      prev.map(t =>
        t.seed === seed ? { ...t, players: [...(t.players || []), emptyPlayer()] } : t
      )
    );
  };

  const removePlayer = (seed, playerIdx) => {
    setTeams(prev =>
      prev.map(t => {
        if (t.seed !== seed) return t;
        const players = t.players.filter((_, i) => i !== playerIdx);
        return { ...t, players };
      })
    );
  };

  const saveTeam = async (seed) => {
    const team = teams.find(t => t.seed === seed);
    if (!team) return;
    setSaving(prev => ({ ...prev, [seed]: true }));
    setSaveResult(prev => ({ ...prev, [seed]: null }));
    try {
      const res = await fetch('/api/rebooted2-teams-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, team }),
      });
      if (res.ok) {
        setSaveResult(prev => ({ ...prev, [seed]: 'ok' }));
      } else if (res.status === 401) {
        setSaveResult(prev => ({ ...prev, [seed]: 'error' }));
      } else {
        // Dev proxy fallback — write directly with service role key
        await devSaveTeam(seed, team);
      }
    } catch {
      // Network error (dev proxy) — same fallback
      await devSaveTeam(seed, team);
    } finally {
      setSaving(prev => ({ ...prev, [seed]: false }));
    }
  };

  const devSaveTeam = async (seed, team) => {
    const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!serviceKey || !url) {
      setSaveResult(prev => ({ ...prev, [seed]: 'error' }));
      return;
    }
    const adminClient = createClient(url, serviceKey);
    const { error } = await adminClient
      .from('rebooted2_teams')
      .upsert(team, { onConflict: 'seed' });
    setSaveResult(prev => ({ ...prev, [seed]: error ? 'error' : 'ok' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <p className="text-primary text-sm font-bold tracking-widest uppercase mb-2">Rebooted 2</p>
            <h1 className="text-white text-3xl font-black">Team Admin</h1>
          </div>
          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Admin password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-primary"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 text-sm">{passwordError}</p>
            )}
            <button
              type="submit"
              disabled={unlocking || !passwordInput.trim()}
              className="w-full py-3 bg-primary text-black font-black rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
            >
              {unlocking ? 'Checking…' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-1">Rebooted 2</p>
            <h1 className="text-white text-2xl font-black">Team Admin</h1>
          </div>
          <button
            onClick={() => { setIsUnlocked(false); setAdminPassword(''); }}
            className="text-white/30 hover:text-white/60 text-sm transition-colors"
          >
            Lock
          </button>
        </div>

        {/* Team cards */}
        {teams.map(team => (
          <div key={team.seed} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">

            {/* Card header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
              <span className="text-primary font-black text-sm w-5 text-right flex-shrink-0">{team.seed}</span>
              <input
                type="text"
                placeholder={`Team ${team.seed} name`}
                value={team.name}
                onChange={e => updateTeamField(team.seed, 'name', e.target.value)}
                className="flex-1 bg-transparent text-white font-bold placeholder-white/20 focus:outline-none"
              />
            </div>

            {/* Logo URL */}
            <div className="px-4 py-3 border-b border-zinc-800 flex flex-col gap-2">
              <label className="text-white/30 text-xs font-bold uppercase tracking-wider">Logo URL</label>
              <div className="flex items-center gap-3">
                {team.logo_url && (
                  <img
                    src={team.logo_url}
                    alt=""
                    className="w-10 h-10 object-contain flex-shrink-0 rounded"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <input
                  type="text"
                  placeholder="https://..."
                  value={team.logo_url}
                  onChange={e => updateTeamField(team.seed, 'logo_url', e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm rounded focus:outline-none focus:border-primary placeholder-white/20"
                />
              </div>
            </div>

            {/* Players */}
            <div className="px-4 py-3 flex flex-col gap-2">
              <label className="text-white/30 text-xs font-bold uppercase tracking-wider">Players</label>
              {(team.players || []).map((player, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="text"
                      placeholder="Player name"
                      value={player.name}
                      onChange={e => updatePlayer(team.seed, i, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-white text-sm rounded focus:outline-none focus:border-primary placeholder-white/20"
                    />
                    <input
                      type="text"
                      placeholder="Dotabuff URL"
                      value={player.dotabuff}
                      onChange={e => updatePlayer(team.seed, i, 'dotabuff', e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-white/60 text-xs rounded focus:outline-none focus:border-primary placeholder-white/20"
                    />
                  </div>
                  <button
                    onClick={() => removePlayer(team.seed, i)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors text-lg leading-none"
                    title="Remove player"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={() => addPlayer(team.seed)}
                className="mt-1 text-primary/60 hover:text-primary text-sm font-medium transition-colors text-left"
              >
                + Add player
              </button>
            </div>

            {/* Save row */}
            <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs">
                {saveResult[team.seed] === 'ok' && (
                  <span className="text-primary">Saved</span>
                )}
                {saveResult[team.seed] === 'error' && (
                  <span className="text-red-400">Save failed</span>
                )}
              </span>
              <button
                onClick={() => saveTeam(team.seed)}
                disabled={saving[team.seed]}
                className="px-5 py-2 bg-primary text-black font-bold text-sm rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {saving[team.seed] ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rebooted2Admin;
