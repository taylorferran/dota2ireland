import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';


const matchKey = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
const parseKey = (key) => key.split('-').map(Number);

// assigned: [{ key: string, roundNum: number }]
const EMPTY_STATE = { results: {}, assigned: [] };

// How many games this seed has completed
const completedGamesFor = (seed, results) =>
  Object.keys(results).filter(k => parseKey(k).includes(seed)).length;

// Seeds currently mid-game (assigned, no result yet)
const getActiveSeedSet = (assigned, results) => {
  const active = new Set();
  assigned.forEach(({ key }) => {
    if (results[key]) return;
    parseKey(key).forEach(s => active.add(s));
  });
  return active;
};

// Backtracking perfect-matching check: can all seeds in `pool` be fully paired
// using only matchups not in `blocked` (a Set of matchKeys)?
// For N≤10 this is fast (<1000 recursive calls).
const hasPerfectMatching = (pool, blocked) => {
  if (pool.length === 0) return true;
  if (pool.length % 2 !== 0) return false;
  const [first, ...rest] = pool;
  for (let i = 0; i < rest.length; i++) {
    if (!blocked.has(matchKey(first, rest[i]))) {
      const remaining = rest.filter((_, j) => j !== i);
      if (hasPerfectMatching(remaining, blocked)) return true;
    }
  }
  return false;
};

// Is it safe to pair (a, b) right now?
// Safe = after pairing them, every other seed that still needs a round-N game
// can still find a valid partner (complete perfect matching exists for them).
// Uses `blocked` = all completed OR currently-scheduled games (so active games
// are correctly treated as unavailable, not just completed ones).
const isPairingSafe = (a, b, blocked, readySeeds, busySeeds) => {
  const remaining = [...readySeeds.filter(s => s !== a && s !== b), ...busySeeds];
  return hasPerfectMatching(remaining, blocked);
};

// Find the next game that can be scheduled.
// Checks each round level (0–8) for seeds that have completed exactly rIdx games
// and aren't currently active. Among those, picks the first safe pair.
const getNextMatch = (results, assigned) => {
  const active = getActiveSeedSet(assigned, results);
  const assignedKeys = new Set(assigned.map(g => g.key));
  // Treat both completed games AND currently-scheduled games as unavailable
  // so the safety check never considers an active matchup as replayable.
  const blocked = new Set([...Object.keys(results), ...assignedKeys]);

  for (let rIdx = 0; rIdx < 9; rIdx++) {
    const roundNum = rIdx + 1;

    // Seeds already scheduled in this round (don't double-book them)
    const inThisRound = new Set();
    assigned.filter(g => g.roundNum === roundNum).forEach(g =>
      parseKey(g.key).forEach(s => inThisRound.add(s))
    );

    // Seeds ready to play round N: completed exactly rIdx games, not active, not already in this round
    const ready = [];
    for (let s = 1; s <= 10; s++) {
      if (completedGamesFor(s, results) === rIdx && !active.has(s) && !inThisRound.has(s)) {
        ready.push(s);
      }
    }
    if (ready.length < 2) continue;

    // Seeds that will eventually need a round-N game but aren't ready yet
    // (still playing an earlier round game)
    const busy = [];
    for (let s = 1; s <= 10; s++) {
      if (completedGamesFor(s, results) < rIdx && !inThisRound.has(s)) {
        busy.push(s);
      }
    }

    // Try every pair of ready seeds; pick first safe one
    for (let i = 0; i < ready.length; i++) {
      for (let j = i + 1; j < ready.length; j++) {
        const a = ready[i], b = ready[j];
        const key = matchKey(a, b);
        if (blocked.has(key)) continue; // already played or assigned
        if (isPairingSafe(a, b, blocked, ready, busy)) {
          return { key, roundNum };
        }
      }
    }
  }
  return null;
};

// Fixed Round 1 — stomp-heavy warmup (pre-seeded, all 5 games known upfront)
const ROUND_1 = [
  { key: matchKey(4, 10), roundNum: 1 },  // Torta vs Pro Mike Stack
  { key: matchKey(1, 5),  roundNum: 1 },  // Wong's vs Sky/Ell
  { key: matchKey(2, 8),  roundNum: 1 },  // Joons vs Cavan Champions
  { key: matchKey(3, 9),  roundNum: 1 },  // Washed & Rejected vs Imprint Esports
  { key: matchKey(6, 7),  roundNum: 1 },  // MT vs Creep Enjoyers
];

// Timeslot for each round
const ROUND_TIMES = {
  1: '11:00', 2: '12:00', 3: '13:00',
  4: '15:00', 5: '16:00', 6: '17:00',
  7: '18:45', 8: '19:45', 9: '20:45',
};

// ─────────────────────────────────────────────

const Rebooted2Tables = () => {
  const [tableState, setTableState] = useState(EMPTY_STATE);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedStandins, setExpandedStandins] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'format';
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });

  const TAB_LABELS = {
    'group-stage': 'Group Stage',
    standings: 'Standings',
    playoffs: 'Playoffs',
    rosters: 'Rosters',
    format: 'Format',
  };
  const TAB_HEADING = {
    'group-stage': 'GROUP STAGE',
    standings: 'GROUP STAGE',
    playoffs: 'PLAYOFFS',
    rosters: 'ROSTERS',
    format: 'FORMAT',
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [finishingGame, setFinishingGame] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('rebooted2_teams').select('*').order('seed'),
      supabase.from('rebooted2_config').select('*').eq('key', 'table_state').maybeSingle(),
    ]).then(([teamsRes, configRes]) => {
      if (teamsRes.data) setTeams(teamsRes.data);
      if (configRes.data?.value) {
        const saved = configRes.data.value;
        if (saved.assigned) {
          // Drop old string-array format (needs reset)
          if (saved.assigned.length > 0 && typeof saved.assigned[0] === 'string') {
            setTableState({ results: {}, assigned: [] });
          } else {
            setTableState(saved);
          }
        }
      }
      setLoading(false);
    });
  }, []);

  // Default to group stage tab once data loads and tournament has started (only if no tab in URL)
  useEffect(() => {
    if (!loading && assigned.length > 0 && !searchParams.get('tab')) {
      setSearchParams({ tab: 'group-stage' }, { replace: true });
    }
  }, [loading]);

  // Spectator polling
  useEffect(() => {
    if (isAdmin) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('rebooted2_config').select('*').eq('key', 'table_state').maybeSingle();
      if (data?.value?.assigned) {
        const saved = data.value;
        if (saved.assigned.length === 0 || typeof saved.assigned[0] === 'object') {
          setTableState(saved);
        }
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const getTeamName = (seed) => teams.find(t => t.seed === seed)?.name || `S${seed}`;

  const assigned = tableState.assigned || [];
  const gamesCompleted = Object.keys(tableState.results).length;
  const gamesActive = assigned.filter(g => !tableState.results[g.key]).length;
  const tournamentStarted = assigned.length > 0;
  const tournamentComplete = gamesCompleted === 45;

  // Build round display data
  const rounds = useMemo(() => {
    const { results } = tableState;
    const active = getActiveSeedSet(assigned, results);

    return Array.from({ length: 9 }, (_, i) => {
      const roundNum = i + 1;
      const rIdx = i;

      const games = assigned
        .filter(g => g.roundNum === roundNum)
        .map(({ key }) => {
          const [a, b] = parseKey(key);
          return { key, a, b, winner: results[key] || null, isActive: !results[key] };
        });

      // Seeds ready for this round but not yet matched
      const inThisRound = new Set(games.flatMap(g => [g.a, g.b]));
      const waitingSeeds = [];
      for (let s = 1; s <= 10; s++) {
        if (completedGamesFor(s, results) === rIdx && !active.has(s) && !inThisRound.has(s)) {
          waitingSeeds.push(s);
        }
      }

      const isComplete = games.length === 5 && games.every(g => g.winner);
      const hasActive = games.some(g => g.isActive);

      return { roundNum, games, waitingSeeds, isComplete, hasActive };
    });
  }, [tableState, assigned]);

  const standings = useMemo(() => {
    const data = Array.from({ length: 10 }, (_, i) => ({ seed: i + 1, wins: 0, losses: 0, played: 0 }));
    Object.entries(tableState.results).forEach(([key, winner]) => {
      const [a, b] = parseKey(key);
      const loser = winner === a ? b : a;
      data[winner - 1].wins++;
      data[winner - 1].played++;
      data[loser - 1].losses++;
      data[loser - 1].played++;
    });
    return data.sort((x, y) => y.wins - x.wins || x.losses - y.losses || x.seed - y.seed);
  }, [tableState.results]);

  const persist = async (newState) => {
    await fetch('/api/rebooted2-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, state: newState }),
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/rebooted2-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput, state: tableState }),
      });
      if (res.ok) {
        setIsAdmin(true);
        setAdminPassword(passwordInput);
        setShowPasswordModal(false);
        setPasswordInput('');
        setPasswordError(false);
      } else if (res.status === 401) {
        setPasswordError(true);
      } else {
        // Non-auth error (e.g. dev proxy) — fall back to VITE var
        const devPassword = import.meta.env.VITE_REBOOTED2_ADMIN_PASSWORD;
        if (devPassword && passwordInput === devPassword) {
          setIsAdmin(true);
          setAdminPassword(passwordInput);
          setShowPasswordModal(false);
          setPasswordInput('');
          setPasswordError(false);
        } else {
          setPasswordError(true);
        }
      }
    } catch {
      const devPassword = import.meta.env.VITE_REBOOTED2_ADMIN_PASSWORD;
      if (devPassword && passwordInput === devPassword) {
        setIsAdmin(true);
        setAdminPassword(passwordInput);
        setShowPasswordModal(false);
        setPasswordInput('');
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStartTournament = async () => {
    if (saving) return;
    setSaving(true);
    // Round 1 is always the fixed stomp warmup — all 5 games start simultaneously
    const newState = { results: {}, assigned: [...ROUND_1] };
    setTableState(newState);
    await persist(newState);
    setSaving(false);
  };

  const handleFinishGame = async (key, winnerSeed) => {
    if (saving) return;
    setSaving(true);
    const newResults = { ...tableState.results, [key]: winnerSeed };
    let newAssigned = [...assigned];

    // Fill up to 5 concurrent active games, only scheduling safe pairs
    let activeCount = newAssigned.filter(g => !newResults[g.key]).length;
    while (activeCount < 5) {
      const next = getNextMatch(newResults, newAssigned);
      if (!next) break;
      newAssigned = [...newAssigned, next];
      activeCount++;
    }

    // Store current state as prev for undo
    const newState = {
      results: newResults,
      assigned: newAssigned,
      prev: { results: tableState.results, assigned: tableState.assigned },
    };
    setTableState(newState);
    await persist(newState);
    setFinishingGame(null);
    setSaving(false);
  };

  const handleUndo = async () => {
    if (saving || !tableState.prev) return;
    setSaving(true);
    const newState = { results: tableState.prev.results, assigned: tableState.prev.assigned };
    setTableState(newState);
    await persist(newState);
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    setTableState(EMPTY_STATE);
    await persist(EMPTY_STATE);
    setShowResetConfirm(false);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-0 mt-2 pb-20">

      {/* Hero */}
      <div className="flex flex-col items-center justify-center gap-2 text-center px-4 pt-8 pb-6">
        <p className="text-primary text-sm font-bold tracking-widest uppercase">Rebooted 2 · 18th/19th April 2026</p>
        <h1 className="text-white text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em]">
          {TAB_HEADING[activeTab] || 'GROUP STAGE'}
        </h1>
      </div>

      {/* Progress — only shown on group stage tabs */}
      <div className={`px-4 pb-4 ${activeTab === 'playoffs' || activeTab === 'format' || activeTab === 'rosters' ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-sm">
            {tournamentComplete
              ? 'All 45 games complete!'
              : tournamentStarted
              ? `${gamesCompleted} / 45 games · ${gamesActive} live`
              : 'Not started'}
          </span>
          {isAdmin && tournamentStarted && !tournamentComplete && (
            <div className="flex items-center gap-3">
              {tableState.prev && (
                <button
                  onClick={handleUndo}
                  disabled={saving}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
                >
                  Undo last result
                </button>
              )}
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-white/25 hover:text-red-400 transition-colors"
              >
                Reset
              </button>
            </div>
          )}
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${(gamesCompleted / 45) * 100}%` }}
          />
        </div>
      </div>

      {/* Start button */}
      {isAdmin && !tournamentStarted && (
        <div className="flex justify-center px-4 pb-6">
          <button
            onClick={handleStartTournament}
            disabled={saving}
            className="px-8 py-3 bg-primary text-black font-black text-lg rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            Start Tournament
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-4">
        {(tournamentStarted
          ? ['group-stage', 'standings', 'playoffs', 'rosters', 'format']
          : ['playoffs', 'rosters', 'format']
        ).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold tracking-wide border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── Group Stage tab ── */}
      {activeTab === 'group-stage' && tournamentStarted && (
        <div className="px-4 pt-4 flex flex-col gap-3">
          {tournamentComplete && (
            <div className="px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg text-center">
              <p className="text-primary font-bold">All 45 games complete!</p>
            </div>
          )}

          {rounds.map((round, idx) => {
            const isFuture = round.games.length === 0 && round.waitingSeeds.length === 0;
            return (
              <div key={round.roundNum}>
                {/* Lunch break between rounds 3 and 4 */}
                {round.roundNum === 4 && tournamentStarted && (
                  <div className="flex items-center gap-3 py-3 my-1">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-white/25 text-xs font-medium tracking-wide">Lunch · 14:00 – 15:00</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                )}
                {/* Dinner break between rounds 6 and 7 */}
                {round.roundNum === 7 && tournamentStarted && (
                  <div className="flex items-center gap-3 py-3 my-1">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-white/25 text-xs font-medium tracking-wide">Dinner · 18:00 – 18:45</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                )}

                <div
                  className={`flex flex-col bg-zinc-900 rounded-lg border overflow-hidden transition-colors ${
                    round.isComplete
                      ? 'border-zinc-800'
                      : round.hasActive
                      ? 'border-zinc-600'
                      : isFuture
                      ? 'border-zinc-800/50 opacity-50'
                      : 'border-zinc-800'
                  }`}
                >
                  {/* Round header */}
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${
                    round.isComplete
                      ? 'border-zinc-800/60'
                      : round.hasActive
                      ? 'border-zinc-700/60 bg-zinc-800/30'
                      : 'border-zinc-800/60'
                  }`}>
                    <span className={`text-xs font-black uppercase tracking-widest ${
                      round.isComplete ? 'text-white/20' : isFuture ? 'text-white/25' : 'text-white/60'
                    }`}>
                      Round {round.roundNum}
                      <span className={`ml-2 font-mono font-normal normal-case tracking-normal ${
                        round.isComplete ? 'text-white/15' : isFuture ? 'text-white/20' : 'text-white/30'
                      }`}>
                        {ROUND_TIMES[round.roundNum]}
                      </span>
                    </span>
                    <span className="text-xs">
                      {round.isComplete && <span className="text-primary/40 font-bold">Complete</span>}
                      {!round.isComplete && round.hasActive && (
                        <span className="flex items-center gap-2 text-white/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                          <span className="font-semibold tabular-nums">
                            {round.games.filter(g => g.isActive).length} live
                          </span>
                        </span>
                      )}
                      {!round.isComplete && !round.hasActive && !isFuture && round.games.length > 0 && !round.waitingSeeds.length && (
                        <span className="text-white/25">Waiting</span>
                      )}
                      {isFuture && tournamentStarted && (
                        <span className="text-white/20 text-xs">Upcoming</span>
                      )}
                    </span>
                  </div>

                  {/* Scheduled games */}
                  {!isFuture && (
                    <div className="divide-y divide-zinc-800/40">
                      {round.games.map(game => (
                        <div
                          key={game.key}
                          className={`flex items-center px-5 py-3.5 ${game.winner ? 'opacity-60' : ''}`}
                        >
                          <span className={`flex-1 font-bold text-sm truncate ${
                            game.winner
                              ? game.winner === game.a ? 'text-primary' : 'text-white/35'
                              : 'text-white'
                          }`}>
                            {getTeamName(game.a)}
                          </span>
                          <div className="flex-shrink-0 w-14 flex items-center justify-center">
                            {game.winner ? (
                              <span className="text-[11px] font-mono font-semibold text-white/25 tabular-nums">
                                {game.winner === game.a ? '1 — 0' : '0 — 1'}
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-white/20 uppercase tracking-widest">vs</span>
                            )}
                          </div>
                          <span className={`flex-1 font-bold text-sm truncate text-right ${
                            game.winner
                              ? game.winner === game.b ? 'text-primary' : 'text-white/35'
                              : 'text-white'
                          }`}>
                            {getTeamName(game.b)}
                          </span>
                          {/* Action slot — only occupies space when admin is logged in */}
                          {isAdmin && (
                            <div className="flex-shrink-0 w-16 flex justify-end pl-3">
                              {game.isActive && (
                                <button
                                  onClick={() => setFinishingGame(game.key)}
                                  disabled={saving}
                                  className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white/50 hover:text-white text-xs font-medium rounded transition-colors disabled:opacity-40"
                                >
                                  Finish
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Teams waiting for an opponent to become free */}
                      {round.waitingSeeds.map(seed => (
                        <div key={`wait-${seed}`} className="flex items-center px-4 py-3 gap-3">
                          <span className="flex-1 font-bold text-sm text-white/35">{getTeamName(seed)}</span>
                          <span className="text-white/20 text-xs italic">waiting for opponent</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Standings tab ── */}
      {activeTab === 'standings' && tournamentStarted && (
        <div className="px-4 pt-4 flex flex-col gap-4">
          {gamesCompleted === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No games completed yet</p>
          ) : (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="py-3 px-4 text-left text-white/30 text-xs font-bold w-8">#</th>
                    <th className="py-3 px-4 text-left text-white/30 text-xs font-bold">Team</th>
                    <th className="py-3 px-4 text-center text-white/30 text-xs font-bold w-14">W</th>
                    <th className="py-3 px-4 text-center text-white/30 text-xs font-bold w-14">L</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, idx) => (
                    <tr
                      key={row.seed}
                      className={`border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30 ${idx === 0 ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <span className={`text-sm font-mono font-bold ${idx === 0 ? 'text-primary' : 'text-white/25'}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white font-bold text-sm">{getTeamName(row.seed)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-sm font-black ${row.wins > 0 ? 'text-primary' : 'text-white/20'}`}>
                          {row.wins}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-sm font-medium ${row.losses > 0 ? 'text-white/50' : 'text-white/20'}`}>
                          {row.losses}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reset button — only shown to admin once all 45 games are done */}
          {isAdmin && tournamentComplete && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-white/25 hover:text-red-400 transition-colors"
              >
                Reset tournament
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Playoffs tab ── */}
      {activeTab === 'playoffs' && (
        <div className="pt-2">
          <iframe
            src="https://challonge.com/pm9a4fyw/module"
            width="100%"
            height="600"
            frameBorder="0"
            scrolling="auto"
            allowTransparency="true"
          />
        </div>
      )}

      {/* ── Rosters tab ── */}
      {activeTab === 'rosters' && (
        <div className="px-4 pt-4 pb-4 grid grid-cols-3 gap-3">
          {[...teams].sort((a, b) => [4,8,2,6,10,1,7,3,9,5].indexOf(a.seed) - [4,8,2,6,10,1,7,3,9,5].indexOf(b.seed)).map(team => (
            <div key={team.seed} className="bg-zinc-900 border border-zinc-700/50 flex flex-col">
              {(() => {
                const POS_IMG = { 1: 'Carry', 2: 'Middle', 3: 'Offlane', 4: 'SoftSupport', 5: 'HardSupport' };
                const main = (team.players || []).filter(p => !p.is_standin);
                const standins = (team.players || []).filter(p => p.is_standin);
                const expanded = expandedStandins.has(team.seed);
                const toggleStandins = () => setExpandedStandins(prev => {
                  const next = new Set(prev);
                  expanded ? next.delete(team.seed) : next.add(team.seed);
                  return next;
                });
                return (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/60">
                      {team.logo_url && <img src={team.logo_url} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                      <span className="font-black text-white text-sm truncate flex-1">{team.name || `Seed ${team.seed}`}</span>
                      {team.team_id && <span className="text-white/25 text-xs font-mono flex-shrink-0">{team.team_id}</span>}
                      {standins.length > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={toggleStandins}
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border transition-colors ${expanded ? 'border-orange-400/50 text-orange-400' : 'border-orange-400/20 text-orange-400/40 hover:border-orange-400/40 hover:text-orange-400/70'}`}
                          >
                            {standins.length} sub{standins.length > 1 ? 's' : ''}
                          </button>
                          <div className="relative group">
                            <span className="text-white/20 group-hover:text-white/50 text-[10px] cursor-default transition-colors leading-none">ⓘ</span>
                            <div className="absolute right-0 top-5 w-48 bg-zinc-800 border border-zinc-700 text-white/60 text-[10px] leading-snug px-2 py-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              Teams will inform you beforehand if they are using stand-ins for your match.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {main.length > 0 ? (
                      <div className={`divide-y ${expanded ? 'divide-transparent' : 'divide-zinc-800/40'}`}>
                        {Array.from({ length: main.length }, (_, i) => {
                          const player = expanded ? standins[i] : main[i];
                          return (
                            <div key={i} className="px-3 py-2 flex items-center gap-1.5">
                              {!expanded
                                ? <img src={`/img/${POS_IMG[i + 1]}.png`} alt="" className="flex-shrink-0 w-4 h-4 object-contain opacity-70" />
                                : <span className="flex-shrink-0 w-4 h-4" />
                              }
                              {player ? (
                                player.dotabuff ? (
                                  <a href={player.dotabuff} target="_blank" rel="noopener noreferrer"
                                    className={`text-xs font-medium transition-colors truncate flex-1 ${expanded ? 'text-white/50 hover:text-primary' : 'text-white/70 hover:text-primary'}`}>
                                    {player.name}
                                  </a>
                                ) : (
                                  <span className={`text-xs truncate flex-1 ${expanded ? 'text-white/40' : 'text-white/50'}`}>{player.name}</span>
                                )
                              ) : (
                                <span className="flex-1" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="px-3 py-2 text-white/20 text-xs italic">No roster yet</p>
                    )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* ── Format tab ── */}
      {activeTab === 'format' && (
        <div className="px-4 pt-4 flex flex-col gap-4 pb-4">

          {/* Overview stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Teams', value: '10' },
              { label: 'Rounds', value: '9' },
              { label: 'Games', value: '45' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-3 text-center">
                <div className="text-white font-black text-xl">{value}</div>
                <div className="text-white/30 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <p className="text-white/40 text-sm leading-relaxed">
            Round robin, every team plays every other team exactly once. Rounds are assigned dynamically as teams finish their games and are ready to play.
          </p>

          {/* Saturday schedule */}
          <div className="flex flex-col gap-2">
            <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Saturday 18th April</h2>

            {/* Morning session */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Morning</span>
                <span className="text-white/25 text-xs font-mono">11:00 – 13:00</span>
              </div>
              {[1, 2, 3].map(rn => (
                <div key={rn} className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/40 last:border-0">
                  <span className="text-white/50 text-sm">Round {rn}</span>
                  <span className="text-white/30 text-xs font-mono">{ROUND_TIMES[rn]}</span>
                </div>
              ))}
            </div>

            {/* Lunch */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-white/25 text-xs font-medium tracking-wide">Lunch · 14:00 – 15:00</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Midday session */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Midday</span>
                <span className="text-white/25 text-xs font-mono">15:00 – 17:00</span>
              </div>
              {[4, 5, 6].map(rn => (
                <div key={rn} className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/40 last:border-0">
                  <span className="text-white/50 text-sm">Round {rn}</span>
                  <span className="text-white/30 text-xs font-mono">{ROUND_TIMES[rn]}</span>
                </div>
              ))}
            </div>

            {/* Dinner */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-white/25 text-xs font-medium tracking-wide">Dinner · 18:00 – 18:45</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Evening session */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Evening</span>
                <span className="text-white/25 text-xs font-mono">18:45 – 20:45</span>
              </div>
              {[7, 8, 9].map(rn => (
                <div key={rn} className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/40 last:border-0">
                  <span className="text-white/50 text-sm">Round {rn}</span>
                  <span className="text-white/30 text-xs font-mono">{ROUND_TIMES[rn]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sunday playoffs */}
          <div className="flex flex-col gap-2">
            <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Sunday 19th April — Playoffs</h2>

            {/* Format note */}
            <p className="text-white/30 text-xs leading-relaxed">
              Double elimination. Seedings are determined by Saturday's group stage standings.
            </p>

            {/* Main venue */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Reboot Cafe / QUB Comp Sci</span>
                <span className="text-white/25 text-xs font-mono">11:00 – 18:00</span>
              </div>

              {[
                {
                  time: '11:00',
                  matches: ['M1: 1st vs 8th', 'M2: 4th vs 5th', 'M3: 2nd vs 7th', 'M4: 3rd vs 6th'],
                  note: 'WR Round 1 — 4 games',
                },
                {
                  time: '12:00',
                  matches: ['M9: W(M1) vs W(M2)', 'M10: W(M3) vs W(M4)', 'M5: L(M2) vs 9th', 'M6: L(M4) vs 10th'],
                  note: 'WR Round 2 + LR Round 1',
                },
                {
                  time: '13:00',
                  matches: ['M14: W(M9) vs W(M10)', 'M7: L(M1) vs W(M5)', 'M8: L(M3) vs W(M6)'],
                  note: 'WR Semis + LR Round 2',
                },
                {
                  time: '14:00',
                  matches: ['Lunch — 45 min'],
                  note: '',
                  isBreak: true,
                },
                {
                  time: '14:45',
                  matches: ['M11: L(M9) vs W(M8)', 'M12: L(M10) vs W(M7)'],
                  note: 'LR Round 3',
                },
                {
                  time: '15:45',
                  matches: ['M13: W(M11) vs W(M12)'],
                  note: 'LR Round 4',
                },
                {
                  time: '16:45',
                  matches: ['M15: L(M14) vs W(M13)'],
                  note: 'LR Final',
                },
              ].map(({ time, matches, note, isBreak }, i) => (
                <div
                  key={time}
                  className={`flex gap-4 px-4 py-3 border-b border-zinc-800/40 last:border-0 ${isBreak ? 'opacity-40' : ''}`}
                >
                  <span className="text-white/30 text-xs font-mono w-10 pt-0.5 flex-shrink-0">{time}</span>
                  <div className="flex flex-col gap-1 flex-1">
                    {matches.map(m => (
                      <span key={m} className={`text-sm ${isBreak ? 'text-white/30 italic' : 'text-white/70'}`}>{m}</span>
                    ))}
                    {note && <span className="text-white/25 text-xs mt-0.5">{note}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Grand final venue */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Reboot Cafe</span>
                <span className="text-white/25 text-xs font-mono">18:30 onwards</span>
              </div>
              <div className="flex gap-4 px-4 py-3">
                <span className="text-white/30 text-xs font-mono w-10 pt-0.5 flex-shrink-0">18:30</span>
                <div className="flex flex-col gap-1">
                  <span className="text-white/70 text-sm">M16: W(M14) vs W(M15)</span>
                  <span className="text-white/25 text-xs">Grand Final · Bo3 · Done ~21:00</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Admin FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        {isAdmin ? (
          <button
            onClick={() => { setIsAdmin(false); setAdminPassword(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-bold rounded-full shadow-lg hover:bg-green-400 transition-colors"
          >
            <span>✓</span> Admin
          </button>
        ) : (
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-700 text-white/30 rounded-full shadow-lg hover:border-primary/50 hover:text-primary/50 transition-colors"
            title="Admin login"
          >
            🔒
          </button>
        )}
      </div>

      {/* Password modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={e => e.target === e.currentTarget && setShowPasswordModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-4">
            <h3 className="text-white font-bold text-lg">Admin Login</h3>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-primary"
                autoFocus
              />
              {passwordError && <p className="text-red-400 text-sm">Incorrect password</p>}
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-2 bg-primary text-black font-bold rounded hover:bg-green-400 transition-colors">Login</button>
                <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(false); }} className="flex-1 py-2 bg-zinc-800 text-white/60 rounded hover:bg-zinc-700 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finish game modal */}
      {finishingGame && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={e => e.target === e.currentTarget && setFinishingGame(null)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-4">
            <div>
              <h3 className="text-white font-bold text-lg">Result</h3>
              <p className="text-white/40 text-sm">Who won?</p>
            </div>
            <div className="flex flex-col gap-3">
              {parseKey(finishingGame).map(seed => (
                <button
                  key={seed}
                  onClick={() => handleFinishGame(finishingGame, seed)}
                  disabled={saving}
                  className="flex items-center gap-3 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold transition-colors text-left disabled:opacity-40"
                >
                  <span className="flex-1">{getTeamName(seed)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setFinishingGame(null)} className="py-2 bg-zinc-800 text-white/40 rounded hover:bg-zinc-700 transition-colors text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Reset confirm modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm flex flex-col gap-4">
            <h3 className="text-white font-bold text-lg">Reset Tournament?</h3>
            <p className="text-white/50 text-sm">This clears all games. Cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleReset} disabled={saving} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-colors disabled:opacity-40">Reset</button>
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 bg-zinc-800 text-white/60 rounded hover:bg-zinc-700 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default Rebooted2Tables;
