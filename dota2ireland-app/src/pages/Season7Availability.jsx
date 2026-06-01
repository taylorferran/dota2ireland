import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// League slot model (matches the scheduler).
const LEAGUE_START = '2026-06-01'; // Monday of Week 1
const WEEKS = 5;
const WKDAY = ['18:00', '19:00', '20:00', '21:00'];
const WKEND = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const SLOT_COLS = WKEND; // 8 columns; weekday-only slots align to the evening ones
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DIV_LABEL = { 1: 'D1', 2: 'D2A', 22: 'D2B', 23: 'D2C', 3: 'D3', 4: 'D4' };
const DIV_ORDER = [1, 2, 22, 23, 3, 4];

const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const jsDay = (iso) => new Date(iso + 'T12:00:00').getDay();
const slotsFor = (iso) => { const d = jsDay(iso); return (d === 0 || d === 6) ? WKEND : WKDAY; };

const parsePlayers = (raw) => {
  const J = (x) => { if (Array.isArray(x)) return x; if (typeof x === 'string') { try { return JSON.parse(x); } catch { return null; } } return x; };
  return (J(raw) || []).map(J).filter(Boolean);
};

// 35 league days
const ALL_DAYS = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(LEAGUE_START, i));

const Season7Availability = () => {
  const [rows, setRows] = useState([]);          // one per player
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortKey, setSortKey] = useState('team');
  const [sortDir, setSortDir] = useState('asc');
  const [teamFilter, setTeamFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [teamsRes, availRes] = await Promise.all([
          supabase.from('teams_s7').select('id,name,division_id,players'),
          supabase.from('s7_availability').select('auth_id,blocked_slots'),
        ]);
        if (teamsRes.error) throw teamsRes.error;
        if (availRes.error) throw availRes.error;

        const blockedBy = {};
        for (const r of availRes.data || []) blockedBy[r.auth_id] = new Set(r.blocked_slots || []);

        const built = [];
        for (const t of teamsRes.data || []) {
          for (const p of parsePlayers(t.players)) {
            const blocked = blockedBy[p.auth_id];
            const submitted = !!blocked;
            let freeDays = 0, freeSlots = 0, totalSlots = 0;
            for (const date of ALL_DAYS) {
              const slots = slotsFor(date);
              totalSlots += slots.length;
              const dayFree = slots.filter((s) => !blocked || !blocked.has(`${date} ${s}`));
              freeSlots += submitted ? dayFree.length : slots.length;
              if (!submitted || dayFree.length > 0) freeDays++;
            }
            built.push({
              team: t.name.trim(),
              division: t.division_id,
              name: p.name || '?',
              position: p.position || '',
              rank: Number(p.rank) || 0,
              authId: p.auth_id,
              blocked,
              submitted,
              freeDays: submitted ? freeDays : 35,
              freeSlots,
              totalSlots,
            });
          }
        }
        setRows(built);
      } catch (e) {
        setError(e.message || 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const teams = useMemo(() => [...new Set(rows.map((r) => r.team))].sort(), [rows]);

  const sorted = useMemo(() => {
    let list = teamFilter === 'all' ? rows : rows.filter((r) => r.team === teamFilter);
    const dir = sortDir === 'asc' ? 1 : -1;
    const cmp = (a, b) => {
      switch (sortKey) {
        case 'player': return a.name.localeCompare(b.name) * dir;
        case 'submitted': return (a.submitted - b.submitted) * dir;
        case 'freeDays': return (a.freeDays - b.freeDays) * dir;
        case 'rank': return (a.rank - b.rank) * dir;
        case 'team':
        default: {
          const d = (DIV_ORDER.indexOf(a.division) - DIV_ORDER.indexOf(b.division)) || a.team.localeCompare(b.team);
          if (d !== 0) return d * dir;
          return a.name.localeCompare(b.name);
        }
      }
    };
    return [...list].sort(cmp);
  }, [rows, teamFilter, sortKey, sortDir]);

  const setSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const submittedCount = rows.filter((r) => r.submitted).length;

  const SortHeader = ({ label, k, className = '' }) => (
    <th
      onClick={() => setSort(k)}
      className={`px-3 py-2 text-xs font-semibold text-white/60 uppercase cursor-pointer select-none hover:text-white ${className}`}
    >
      {label}{sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-1">Season 7</p>
            <h1 className="text-white text-3xl font-black">Player Availability</h1>
          </div>
        </div>

        {loading ? (
          <p className="text-white/60">Loading availability…</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
              <span className="text-white/70">{rows.length} players · <span className="text-primary">{submittedCount} submitted</span> · <span className="text-red-400">{rows.length - submittedCount} missing</span></span>
              <label className="flex items-center gap-2 text-white/60">
                Team:
                <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white rounded px-2 py-1">
                  <option value="all">All teams</option>
                  {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <span className="text-white/40 text-xs">Green = free, red = blocked. Click a row for the full grid.</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full">
                <thead className="bg-zinc-900">
                  <tr className="text-left border-b border-white/10">
                    <SortHeader label="Team" k="team" />
                    <SortHeader label="Player" k="player" />
                    <th className="px-3 py-2 text-xs font-semibold text-white/60 uppercase">Pos</th>
                    <SortHeader label="MMR" k="rank" className="text-center" />
                    <SortHeader label="Submitted" k="submitted" className="text-center" />
                    <SortHeader label="Free days" k="freeDays" className="text-center" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <FragmentRow key={r.authId || `${r.team}-${r.name}`} r={r} expanded={expanded} setExpanded={setExpanded} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Row + expandable availability grid
const FragmentRow = ({ r, expanded, setExpanded }) => {
  const key = r.authId || `${r.team}-${r.name}`;
  const isOpen = expanded === key;
  return (
    <>
      <tr
        onClick={() => setExpanded(isOpen ? null : key)}
        className={`border-b border-white/5 cursor-pointer hover:bg-white/5 ${isOpen ? 'bg-white/5' : ''}`}
      >
        <td className="px-3 py-2 text-sm text-white/80">
          <span className="text-white/40 text-xs mr-1">{DIV_LABEL[r.division] || r.division}</span>{r.team}
        </td>
        <td className="px-3 py-2 text-sm text-white font-medium">{r.name}</td>
        <td className="px-3 py-2 text-sm text-white/60">{r.position}</td>
        <td className="px-3 py-2 text-sm text-center text-white/70">{r.rank ? r.rank.toLocaleString() : '-'}</td>
        <td className="px-3 py-2 text-center">{r.submitted ? <span className="text-primary">✅</span> : <span className="text-red-400">❌</span>}</td>
        <td className={`px-3 py-2 text-sm text-center font-semibold ${!r.submitted ? 'text-white/40' : r.freeDays < 12 ? 'text-red-400' : 'text-white/80'}`}>
          {r.submitted ? `${r.freeDays}/35` : '—'}
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-zinc-950">
          <td colSpan={6} className="px-3 py-4">
            {!r.submitted ? (
              <p className="text-white/50 text-sm">No availability submitted.</p>
            ) : (
              <AvailabilityGrid blocked={r.blocked} />
            )}
          </td>
        </tr>
      )}
    </>
  );
};

const AvailabilityGrid = ({ blocked }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: WEEKS }, (_, w) => (
      <div key={w}>
        <p className="text-white/50 text-xs font-semibold mb-1">Week {w + 1}</p>
        <div className="overflow-x-auto">
          <table className="text-[10px]">
            <thead>
              <tr>
                <th className="px-1 py-0.5 text-white/40 font-normal text-left w-16"></th>
                {SLOT_COLS.map((s) => <th key={s} className="px-1.5 py-0.5 text-white/40 font-normal">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }, (_, d) => {
                const date = addDays(LEAGUE_START, w * 7 + d);
                const valid = new Set(slotsFor(date));
                return (
                  <tr key={date}>
                    <td className="px-1 py-0.5 text-white/50 whitespace-nowrap">{DOW[jsDay(date)]} {date.slice(8)}</td>
                    {SLOT_COLS.map((s) => {
                      if (!valid.has(s)) return <td key={s} className="px-1.5 py-0.5"><div className="w-full h-3.5 rounded-sm bg-zinc-900" /></td>;
                      const free = !blocked.has(`${date} ${s}`);
                      return (
                        <td key={s} className="px-1.5 py-0.5">
                          <div className={`w-full h-3.5 rounded-sm ${free ? 'bg-green-500/70' : 'bg-red-500/40'}`} title={`${date} ${s} — ${free ? 'free' : 'blocked'}`} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </div>
);

export default Season7Availability;
