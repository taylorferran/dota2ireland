import { useState, useMemo } from 'react';

const DIV_LABELS = {
  1: { label: 'D1', className: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  2: { label: 'D2A', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  22: { label: 'D2B', className: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
  23: { label: 'D2C', className: 'bg-pink-500/20 text-pink-300 border border-pink-500/30' },
  3: { label: 'D3', className: 'bg-green-500/20 text-green-300 border border-green-500/30' },
};

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IE', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

const LEAGUE_START = '2026-06-01'; // Monday of Week 1

// Full Monday–Sunday calendar week for a given week number, independent of which
// days actually have matches scheduled.
function fmtWeekRange(week) {
  const monday = new Date(LEAGUE_START + 'T12:00:00');
  monday.setDate(monday.getDate() + 7 * (week - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return `${monday.toLocaleDateString('en-IE', opts)} – ${sunday.toLocaleDateString('en-IE', opts)}`;
}

export default function S7MatchCalendar({ matches, teamNamesMap, myTeamId, showDivisionBadge = false }) {
  const [myGamesOnly, setMyGamesOnly] = useState(false);

  const getTeamName = (id) => teamNamesMap[id] ?? id;

  const visibleMatches = useMemo(() => {
    if (!myGamesOnly || !myTeamId) return matches;
    return matches.filter(m => m.team1Id === myTeamId || m.team2Id === myTeamId);
  }, [matches, myGamesOnly, myTeamId]);

  // Group by week → sorted dates within week
  const byWeek = useMemo(() => {
    const map = new Map();
    for (const m of visibleMatches) {
      if (!map.has(m.week)) map.set(m.week, []);
      map.get(m.week).push(m);
    }
    // Sort entries by week number
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [visibleMatches]);

  const isMyMatch = (m) => myTeamId && (m.team1Id === myTeamId || m.team2Id === myTeamId);

  if (!matches.length) {
    return (
      <div className="text-center text-white/40 py-12">
        Schedule not yet available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">All times Dublin (Europe/Dublin)</p>
        {myTeamId && (
          <button
            onClick={() => setMyGamesOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              myGamesOnly
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-white/5 text-white/60 border-white/15 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            My Games
          </button>
        )}
      </div>

      {byWeek.length === 0 && (
        <div className="text-center text-white/40 py-8">No matches to show.</div>
      )}

      {byWeek.map(([week, weekMatches]) => {
        // Group matches within week by date
        const byDate = new Map();
        for (const m of [...weekMatches].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))) {
          if (!byDate.has(m.date)) byDate.set(m.date, []);
          byDate.get(m.date).push(m);
        }

        return (
          <div key={week} className="bg-zinc-900 rounded-lg border border-white/10 overflow-hidden">
            {/* Week header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-bold">Week {week}</span>
              <span className="text-white/40 text-xs">{fmtWeekRange(Number(week))}</span>
            </div>

            {/* Date groups */}
            <div className="divide-y divide-white/5">
              {[...byDate.entries()].map(([date, dayMatches]) => (
                <div key={date}>
                  {/* Date sub-header */}
                  <div className="px-4 py-2 bg-white/[0.02]">
                    <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{fmtDate(date)}</span>
                  </div>

                  {/* Matches */}
                  {dayMatches.map((m) => {
                    const highlight = isMyMatch(m);
                    return (
                      <div
                        key={m.id}
                        className={`px-4 py-3 flex items-center gap-0 ${
                          highlight ? 'bg-primary/5 border-l-2 border-primary' : ''
                        }`}
                      >
                        {/* Time — fixed width */}
                        <span className="text-xs font-mono text-white/40 w-14 shrink-0">{m.time}</span>

                        {/* Division badge — fixed width */}
                        {showDivisionBadge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-10 shrink-0 text-center ${DIV_LABELS[m.division]?.className ?? ''}`}>
                            {DIV_LABELS[m.division]?.label ?? ''}
                          </span>
                        )}

                        {/* Team 1 — right-aligned in its half */}
                        <span className={`font-medium text-sm truncate flex-1 text-right pr-4 ${highlight && m.team1Id === myTeamId ? 'text-primary' : 'text-white'}`}>
                          {getTeamName(m.team1Id)}
                        </span>

                        {/* Score / vs — fixed center column */}
                        <span className="text-white/40 text-xs font-mono w-14 text-center shrink-0">
                          {m.completed && m.score ? `${m.score[0]} – ${m.score[1]}` : 'vs'}
                        </span>

                        {/* Team 2 — left-aligned in its half */}
                        <span className={`font-medium text-sm truncate flex-1 pl-4 ${highlight && m.team2Id === myTeamId ? 'text-primary' : 'text-white'}`}>
                          {getTeamName(m.team2Id)}
                        </span>

                        {/* Completed indicator */}
                        <span className="w-6 shrink-0 text-right">
                          {m.completed && (
                            <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
