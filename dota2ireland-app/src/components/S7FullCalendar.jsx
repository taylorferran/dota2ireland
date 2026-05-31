import { useState, useMemo } from 'react';

const DIV_CONFIG = {
  1:  { label: 'D1',  color: '#FACC15', bg: 'rgba(250,204,21,0.13)'  },
  2:  { label: 'D2A', color: '#60A5FA', bg: 'rgba(96,165,250,0.13)'  },
  22: { label: 'D2B', color: '#C084FC', bg: 'rgba(192,132,252,0.13)' },
  23: { label: 'D2C', color: '#F472B6', bg: 'rgba(244,114,182,0.13)' },
  3:  { label: 'D3',  color: '#4ADE80', bg: 'rgba(74,222,128,0.13)'  },
};

// Explicit display order (object key iteration would sort numerically: 1,2,3,22,23).
const DIV_ORDER = [1, 2, 22, 23, 3];

const PRIMARY = '#13ec5b';
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Build a grid of calendar weeks for a given year/month (0-indexed month)
function buildMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawDow = new Date(year, month, 1).getDay(); // 0=Sun
  const firstDow = rawDow === 0 ? 6 : rawDow - 1;  // shift to Mon=0

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function iso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function fmtFullDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

const MONTHS = [
  { year: 2026, month: 5, label: 'June 2026' },
  { year: 2026, month: 6, label: 'July 2026' },
];

export default function S7FullCalendar({ matches, teamNamesMap, myTeamId }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [myGamesOnly, setMyGamesOnly] = useState(false);

  const getTeamName = (id) => teamNamesMap[id] ?? id;
  const isMyMatch   = (m) => !!(myTeamId && (m.team1Id === myTeamId || m.team2Id === myTeamId));

  const matchesByDate = useMemo(() => {
    const map = new Map();
    const src = myGamesOnly && myTeamId
      ? matches.filter(m => m.team1Id === myTeamId || m.team2Id === myTeamId)
      : matches;
    for (const m of src) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    }
    return map;
  }, [matches, myGamesOnly, myTeamId]);

  const selectedMatches = useMemo(
    () => selectedDate
      ? [...(matchesByDate.get(selectedDate) ?? [])].sort((a, b) => a.time.localeCompare(b.time))
      : [],
    [selectedDate, matchesByDate]
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">

      {/* Top bar: legend + My Games */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5 flex-wrap">
          {DIV_ORDER.map((div) => DIV_CONFIG[div] && (
            <div key={div} className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: DIV_CONFIG[div].color }} />
              <span className="text-xs text-white/50 font-medium">{DIV_CONFIG[div].label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/25">Click a date to see matches · All times Dublin</span>
          {myTeamId && (
            <button
              onClick={() => setMyGamesOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                myGamesOnly
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-white/5 text-white/55 border-white/12 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>
              My Games
            </button>
          )}
        </div>
      </div>

      {/* Month grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {MONTHS.map(({ year, month, label }) => {
          const weeks = buildMonthGrid(year, month);

          return (
            <div key={label} className="rounded-2xl border border-white/10 overflow-hidden bg-zinc-900">

              {/* Month header */}
              <div className="px-5 py-4 border-b border-white/8">
                <h3 className="text-white font-black text-lg tracking-tight">{label}</h3>
              </div>

              {/* Day-name header */}
              <div className="grid grid-cols-7 border-b border-white/8">
                {DAY_NAMES.map(d => (
                  <div key={d} className="py-2.5 text-center text-[11px] font-bold text-white/30 uppercase tracking-widest">
                    {d}
                  </div>
                ))}
              </div>

              {/* Week rows */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-white/5 last:border-0">
                  {week.map((day, di) => {
                    // Empty cell (padding before/after month)
                    if (!day) {
                      return (
                        <div
                          key={di}
                          className="border-r border-white/5 last:border-0 bg-black/20"
                          style={{ minHeight: 88 }}
                        />
                      );
                    }

                    const date       = iso(year, month, day);
                    const dayMatches = matchesByDate.get(date) ?? [];
                    const isSelected = date === selectedDate;
                    const isToday    = date === today;
                    const hasMatches = dayMatches.length > 0;
                    const hasMyGame  = dayMatches.some(isMyMatch);

                    return (
                      <div
                        key={di}
                        onClick={() => hasMatches && setSelectedDate(isSelected ? null : date)}
                        style={{ minHeight: 88, background: isSelected ? 'rgba(255,255,255,0.06)' : undefined }}
                        className={`border-r border-white/5 last:border-0 p-2 flex flex-col gap-1 transition-colors ${
                          hasMatches ? 'cursor-pointer hover:bg-white/[0.03]' : ''
                        }`}
                      >
                        {/* Day number */}
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            style={isToday ? { background: PRIMARY, color: '#000' } : undefined}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold leading-none ${
                              isToday   ? '' :
                              isSelected ? 'bg-white/15 text-white' :
                              hasMatches ? 'text-white/75' :
                              'text-white/20'
                            }`}
                          >
                            {day}
                          </span>
                          {/* Dot for user's game (when not in myGamesOnly mode) */}
                          {hasMyGame && !myGamesOnly && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIMARY }} />
                          )}
                        </div>

                        {/* Event chips — sorted D1→D2A→D2B→D2C→D3 */}
                        {[...dayMatches]
                          .sort((a, b) => DIV_ORDER.indexOf(a.division) - DIV_ORDER.indexOf(b.division))
                          .map(m => {
                            const cfg  = DIV_CONFIG[m.division];
                            const mine = isMyMatch(m);
                            return (
                              <div
                                key={m.id}
                                style={{
                                  background: mine ? 'rgba(19,236,91,0.12)' : cfg.bg,
                                  borderLeft: `2.5px solid ${mine ? PRIMARY : cfg.color}`,
                                }}
                                className="rounded-r-md px-1.5 py-0.5 flex items-center gap-1.5"
                              >
                                <span
                                  style={{ color: mine ? PRIMARY : cfg.color }}
                                  className="text-[10px] font-black leading-none shrink-0"
                                >
                                  {cfg.label}
                                </span>
                                <span className="text-[10px] font-mono text-white/55 leading-none shrink-0">
                                  {m.time}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedDate && (
        <div className="rounded-2xl border border-white/12 bg-zinc-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <h3 className="text-white font-bold">{fmtFullDate(selectedDate)}</h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-white/35 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {selectedMatches.length === 0 ? (
            <div className="py-10 text-center text-white/30 text-sm">No matches on this day.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {selectedMatches.map(m => {
                const cfg  = DIV_CONFIG[m.division];
                const mine = isMyMatch(m);
                return (
                  <div
                    key={m.id}
                    style={{ background: mine ? 'rgba(19,236,91,0.04)' : undefined }}
                    className="flex items-stretch"
                  >
                    {/* Accent bar */}
                    <div className="w-1 shrink-0" style={{ background: mine ? PRIMARY : cfg.color }} />

                    {/* Team 1 */}
                    <div className="flex-1 flex items-center justify-end px-5 py-4">
                      <span
                        style={mine && m.team1Id === myTeamId ? { color: PRIMARY } : undefined}
                        className="font-bold text-base text-right text-white leading-snug"
                      >
                        {getTeamName(m.team1Id)}
                      </span>
                    </div>

                    {/* Centre: div label + time */}
                    <div className="flex flex-col items-center justify-center px-5 py-4 shrink-0 w-24 border-x border-white/[0.06]">
                      <span
                        style={{ color: cfg.color }}
                        className="text-[11px] font-black uppercase tracking-wide"
                      >
                        {cfg.label}
                      </span>
                      <span className="text-white/75 font-mono text-sm font-semibold mt-1 tabular-nums">
                        {m.completed && m.score ? `${m.score[0]}–${m.score[1]}` : m.time}
                      </span>
                    </div>

                    {/* Team 2 */}
                    <div className="flex-1 flex items-center px-5 py-4">
                      <span
                        style={mine && m.team2Id === myTeamId ? { color: PRIMARY } : undefined}
                        className="font-bold text-base text-white leading-snug"
                      >
                        {getTeamName(m.team2Id)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-white/20 text-center pb-2">
        All times Dublin (Europe/Dublin)
      </p>
    </div>
  );
}
