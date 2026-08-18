// Season 7 playoff brackets, rendered per division as a week-by-week timeline.
// Each round column carries its calendar dates so it's clear when every match runs.
// Seeds are filled from current group standings via deriveS7Seeds() and update live as
// results come in; they finalise when the group stages close.
//
// Bracket structures (see the planning doc):
//   Div 1  - 3-team double elim, #1 byes to Winners Final          (4 weeks)  layout: double
//   Div 2  - 15-team single elimination, #1 byes the Round of 16   (4 weeks)  layout: single
//   Div 3  - 4-team double elim                                    (4 weeks)  layout: double
//
// Every match carries an `id` plus `win`/`lose` targets (another match id, or null when
// that outcome is eliminated). These drive the hover arrows that trace where a winner
// or loser flows next.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { s7PlayoffResults } from '../data/s7PlayoffResults';
import s7PlayoffGames from '../data/s7PlayoffGames.json';
import { fetchMatchDetails } from '../services/matchApi';
import { gameFromMatchDetail, normTeamName } from '../utils/s7Results';
import { MatchDetailPanel } from './MatchDetailPanel';

const WEEKS_4 = [
  { n: 1, dates: 'Jul 6-12' },
  { n: 2, dates: 'Jul 13-19' },
  { n: 3, dates: 'Jul 20-26' },
  { n: 4, dates: 'Jul 27 - Aug 2' },
];

// Division 3 ran an extra group-stage week, so its playoffs run one week behind the others.
const WEEKS_4_D3 = [
  { n: 1, dates: 'Jul 13-19' },
  { n: 2, dates: 'Jul 20-26' },
  { n: 3, dates: 'Jul 27 - Aug 2' },
  { n: 4, dates: 'Aug 3-9' },
];

const seed = (n) => ({ seed: n });
const ref = (name) => ({ ref: name });
const datesFor = (weeks, n) => weeks.find((w) => w.n === n)?.dates ?? '';

const BRACKETS = {
  1: {
    layout: 'double',
    title: 'Division 1',
    format: '3-Team Double Elimination',
    span: 'Jul 6 - Aug 2',
    meta: '3 teams, 4 weeks (+reset)',
    weeks: WEEKS_4,
    upper: [
      {
        week: 1,
        matches: [{
          id: 'ws', win: 'wf', lose: 'lf',
          round: 'Winners Semi', bo: 'Bo3',
          slots: [seed(2), seed(3)],
          note: 'Loser drops to Losers Final',
          bye: 'Seed 1 byes to Winners Final',
        }],
      },
      {
        week: 2,
        matches: [{
          id: 'wf', win: 'gf', lose: 'lf',
          round: 'Winners Final', bo: 'Bo3',
          slots: [seed(1), ref('Winners Semi winner')],
          note: 'Winner to Grand Final, loser drops to Losers Final',
        }],
      },
    ],
    lower: [
      {
        week: 3,
        matches: [{
          id: 'lf', win: 'gf', lose: null,
          round: 'Losers Final', bo: 'Bo3',
          slots: [ref('Winners Semi loser'), ref('Winners Final loser')],
          note: 'Loser eliminated, 3rd place',
        }],
      },
    ],
    gf: {
      id: 'gf', week: 4, round: 'Grand Final', bo: 'Bo3',
      slots: [ref('Winners Final winner'), ref('Losers Final winner')],
      note: 'Best-of-3 grand final',
    },
    footer: "Teams: 2 Samuel's 2 Sexy, Business Mices, WONGWONGBAKERY. Seeded 1 to 3 by current group standings; the number 1 seed skips the opening round straight into the Winners Final.",
  },

  2: {
    layout: 'single',
    hideSeeds: true,
    title: 'Division 2',
    format: '15-Team Single Elimination',
    span: 'Jul 6 - Aug 2',
    meta: '15 teams, 4 weeks',
    weeks: WEEKS_4,
    columns: [
      {
        week: 1, label: 'Round of 16',
        matches: [
          { id: 'r1m2', win: 'qf1', round: 'Ro16', bo: 'Bo3', slots: [seed(8), seed(9)], note: 'Loser eliminated' },
          { id: 'r1m3', win: 'qf2', round: 'Ro16', bo: 'Bo3', slots: [seed(5), seed(12)], note: 'Loser eliminated' },
          { id: 'r1m4', win: 'qf2', round: 'Ro16', bo: 'Bo3', slots: [seed(4), seed(13)], note: 'Loser eliminated' },
          { id: 'r1m5', win: 'qf3', round: 'Ro16', bo: 'Bo3', slots: [seed(3), seed(14)], note: 'Loser eliminated' },
          { id: 'r1m6', win: 'qf3', round: 'Ro16', bo: 'Bo3', slots: [seed(6), seed(11)], note: 'Loser eliminated' },
          { id: 'r1m7', win: 'qf4', round: 'Ro16', bo: 'Bo3', slots: [seed(7), seed(10)], note: 'Loser eliminated' },
          { id: 'r1m8', win: 'qf4', round: 'Ro16', bo: 'Bo3', slots: [seed(2), seed(15)], note: 'Loser eliminated' },
        ],
      },
      {
        week: 2, label: 'Quarterfinals',
        matches: [
          { id: 'qf1', win: 'sf1', round: 'Quarterfinal', bo: 'Bo3', slots: [seed(1), ref('Ro16 winner')], note: 'Loser eliminated' },
          { id: 'qf2', win: 'sf1', round: 'Quarterfinal', bo: 'Bo3', slots: [ref('Ro16 winner'), ref('Ro16 winner')], note: 'Loser eliminated' },
          { id: 'qf3', win: 'sf2', round: 'Quarterfinal', bo: 'Bo3', slots: [ref('Ro16 winner'), ref('Ro16 winner')], note: 'Loser eliminated' },
          { id: 'qf4', win: 'sf2', round: 'Quarterfinal', bo: 'Bo3', slots: [ref('Ro16 winner'), ref('Ro16 winner')], note: 'Loser eliminated' },
        ],
      },
      {
        week: 3, label: 'Semifinals',
        matches: [
          { id: 'sf1', win: 'final', round: 'Semifinal', bo: 'Bo3', slots: [ref('Quarterfinal winner'), ref('Quarterfinal winner')], note: 'Loser eliminated' },
          { id: 'sf2', win: 'final', round: 'Semifinal', bo: 'Bo3', slots: [ref('Quarterfinal winner'), ref('Quarterfinal winner')], note: 'Loser eliminated' },
        ],
      },
      {
        week: 4, label: 'Final',
        matches: [
          { id: 'final', win: null, tone: 'gf', round: 'Grand Final', bo: 'Bo3', slots: [ref('Semifinal winner'), ref('Semifinal winner')], note: 'Champion' },
        ],
      },
    ],
    footer: 'All 15 teams qualify. The draw ranks teams by group placement then record, and arranges them so opponents come from different groups as much as possible; the top team byes the Round of 16. Single elimination, Bo3 until the Bo5 final.',
  },

  3: {
    layout: 'double',
    title: 'Division 3',
    format: '4-Team Double Elimination',
    span: 'Jul 13 - Aug 9',
    meta: '4 teams, 4 weeks (+reset)',
    weeks: WEEKS_4_D3,
    upper: [
      {
        week: 1,
        matches: [
          { id: 'sf1', win: 'wf', lose: 'lr1', round: 'Winners SF1', bo: 'Bo3', slots: [seed(1), seed(4)], note: 'Loser drops to Lower R1' },
          { id: 'sf2', win: 'wf', lose: 'lr1', round: 'Winners SF2', bo: 'Bo3', slots: [seed(2), seed(3)], note: 'Loser drops to Lower R1' },
        ],
      },
      {
        week: 2,
        matches: [{
          id: 'wf', win: 'gf', lose: 'lf',
          round: 'Winners Final', bo: 'Bo3',
          slots: [ref('Winners SF1 winner'), ref('Winners SF2 winner')],
          note: 'Winner to Grand Final, loser drops to Lower Final',
        }],
      },
    ],
    lower: [
      {
        week: 2,
        matches: [{
          id: 'lr1', win: 'lf', lose: null,
          round: 'Lower R1', bo: 'Bo3',
          slots: [ref('Winners SF1 loser'), ref('Winners SF2 loser')],
          note: 'Loser eliminated, 4th place',
        }],
      },
      {
        week: 3,
        matches: [{
          id: 'lf', win: 'gf', lose: null,
          round: 'Lower Final', bo: 'Bo3',
          slots: [ref('Winners Final loser'), ref('Lower R1 winner')],
          note: 'Loser eliminated, 3rd place',
        }],
      },
    ],
    gf: {
      id: 'gf', week: 4, round: 'Grand Final', bo: 'Bo3',
      slots: [ref('Winners Final winner'), ref('Lower Final winner')],
      note: 'Best-of-3 grand final',
    },
    footer: 'Teams: Bord na Mona, Grumpy Old Men, Team Sosal, Wreck the Herald. Seeded 1 to 4 by current group standings (1 v 4, 2 v 3).',
  },
};

// `rs` is a resolved slot: { kind:'ref', text } for an undecided feeder, or
// { kind:'team', seed, name } for a filled slot. `status` is 'winner' | 'loser' | null.
const Slot = ({ rs, tone, hideSeeds, status, score }) => {
  if (rs.kind === 'ref') {
    return (
      <div className="flex items-center gap-2 py-1.5 text-[13px] text-white/55 italic border-t border-white/5 first:border-t-0">
        {!hideSeeds && <span className="w-5 shrink-0" />}
        <span className="truncate">{rs.text}</span>
      </div>
    );
  }
  const { name, seed } = rs;
  const nameCls = status === 'loser'
    ? 'line-through text-white/35'
    : status === 'winner'
      ? 'text-primary font-semibold'
      : (name ? 'text-white font-medium' : 'text-white/45');
  const chipTone = status === 'winner' ? 'bg-primary text-black'
    : status === 'loser' ? 'bg-white/10 text-white/40'
    : tone === 'lo' ? 'bg-accent-orange text-black' : 'bg-primary text-black';
  return (
    <div className="flex items-center gap-2 py-1.5 text-[13px] border-t border-white/5 first:border-t-0">
      {!hideSeeds && seed != null && (
        <span className={`inline-flex items-center justify-center w-5 h-5 shrink-0 rounded text-[11px] font-bold ${chipTone}`}>{seed}</span>
      )}
      <span className={`truncate ${nameCls}`}>{name || (hideSeeds ? 'TBD' : `Seed ${seed}`)}</span>
      {status === 'winner' && score && <span className="ml-auto shrink-0 text-[11px] font-bold text-primary">{score}</span>}
    </div>
  );
};

const MatchCard = ({ match, tone, hideSeeds, view, onOpen, innerRef, onEnter, onLeave, highlight }) => {
  const { slots: resolved, decided, winnerSeed, score, note } = view;
  const clickable = typeof onOpen === 'function';
  const base =
    tone === 'gf' ? 'border border-primary/50 bg-gradient-to-br from-primary/10 to-accent-orange/5 shadow-[0_0_22px_rgba(19,236,91,0.12)]'
    : tone === 'lo' ? 'border border-white/10 border-l-[3px] border-l-accent-orange bg-zinc-900'
    : 'border border-white/10 border-l-[3px] border-l-primary bg-zinc-900';
  const ring =
    highlight === 'source' ? 'ring-2 ring-white/50'
    : highlight === 'win' ? 'ring-2 ring-primary'
    : highlight === 'lose' ? 'ring-2 ring-accent-orange'
    : '';
  const roundTone = tone === 'gf' ? 'text-primary' : 'text-white/50';
  const boTone = tone === 'gf' ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white/80 border-white/10';

  return (
    <div
      ref={innerRef}
      tabIndex={0}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={clickable ? onOpen : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } } : undefined}
      role={clickable ? 'button' : undefined}
      className={`rounded-md p-2.5 outline-none transition-shadow ${clickable ? 'cursor-pointer hover:ring-1 hover:ring-white/30' : 'cursor-default'} ${base} ${ring}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${roundTone}`}>
          {match.round}
          {note && (
            <span
              className="material-symbols-outlined text-[13px] text-white/50 cursor-help"
              title={note}
              onClick={(e) => e.stopPropagation()}
            >info</span>
          )}
        </span>
        {match.bo && <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${boTone}`}>{match.bo}</span>}
      </div>
      {resolved.map((rs, i) => {
        const status = decided && rs.kind === 'team'
          ? (rs.seed === winnerSeed ? 'winner' : 'loser')
          : null;
        return <Slot key={i} rs={rs} tone={tone} hideSeeds={hideSeeds} status={status} score={status === 'winner' ? score : null} />;
      })}
      {clickable && (
        <div className="mt-2 flex items-center gap-1 text-[10.5px] text-primary">
          <span className="material-symbols-outlined text-[13px]">bar_chart</span>
          View games
        </div>
      )}
      {match.note && <div className="mt-2 text-[10.5px] text-white/40">{match.note}</div>}
      {match.bye && (
        <div className="mt-2 text-[10.5px] text-primary text-center border border-dashed border-primary/40 rounded px-2 py-1.5">
          {match.bye}
        </div>
      )}
    </div>
  );
};

const LaneLabel = ({ label, tone, row }) => (
  <div
    className={`flex items-center justify-center rounded-md border text-[11px] uppercase tracking-[0.2em] ${
      tone === 'lo' ? 'text-accent-orange border-accent-orange/20 bg-accent-orange/5' : 'text-primary border-primary/20 bg-primary/5'
    }`}
    style={{ gridColumn: 1, gridRow: row, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
  >
    {label}
  </div>
);

const WeekHeader = ({ week, dates, label, ...pos }) => (
  <div {...pos} className="flex flex-col gap-0.5 px-3 py-2 rounded-md border border-white/10 bg-zinc-800/60">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-white">Week {week}</span>
    <span className="text-[11.5px] text-white/50">{dates}</span>
    {label && <span className="text-[10.5px] font-medium text-primary uppercase tracking-wide mt-0.5">{label}</span>}
  </div>
);

// Build a right-angle "elbow" connector (in container-relative px) from a card's right
// edge to the next card's left edge: horizontal out, vertical across, horizontal in. This
// is the classic bracket connector - always correct regardless of vertical offset, and
// two feeders sharing a target merge into a clean fork.
function edgePath(sr, tr, cr) {
  const sx = sr.right - cr.left;
  const sy = (sr.top + sr.bottom) / 2 - cr.top;
  const tx = tr.left - cr.left;
  const ty = (tr.top + tr.bottom) / 2 - cr.top;
  const midX = tx > sx ? sx + (tx - sx) / 2 : sx; // fork halfway across the gap
  return `M ${sx} ${sy} H ${midX} V ${ty} H ${tx}`;
}

export const S7PlayoffBracket = ({ division, seeds }) => {
  const b = BRACKETS[division];
  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const [hovered, setHovered] = useState(null);
  const [edges, setEdges] = useState([]);
  const [tick, setTick] = useState(0);
  const [series, setSeries] = useState(null); // { round, bo, names, winnerName, score }
  const [seriesGames, setSeriesGames] = useState(null);
  const [seriesLoading, setSeriesLoading] = useState(false);

  // Flow lookup: match id -> { win, lose } target ids.
  const flow = useMemo(() => {
    const map = {};
    if (!b) return map;
    const add = (m) => { map[m.id] = { win: m.win ?? null, lose: m.lose ?? null }; };
    if (b.layout === 'single') {
      b.columns.forEach((col) => col.matches.forEach(add));
    } else {
      [...b.upper, ...b.lower].forEach((cell) => cell.matches.forEach(add));
      if (b.gf) add(b.gf);
    }
    return map;
  }, [b]);

  // Recorded results for this division.
  const results = useMemo(() => (b ? (s7PlayoffResults[division] || {}) : {}), [b, division]);

  // Match lookup + winner-advancement wiring (win-feeders per match, and round-name lookup).
  const { byId, byRound, winFeeders } = useMemo(() => {
    const byIdMap = {}, byRoundMap = {}, feed = {};
    if (b) {
      const all = b.layout === 'single'
        ? b.columns.flatMap((c) => c.matches)
        : [...b.upper.flatMap((c) => c.matches), ...b.lower.flatMap((c) => c.matches), ...(b.gf ? [b.gf] : [])];
      all.forEach((m) => {
        byIdMap[m.id] = m;
        if (m.round) byRoundMap[m.round] = m;
        if (m.win) (feed[m.win] = feed[m.win] || []).push(m.id);
      });
    }
    return { byId: byIdMap, byRound: byRoundMap, winFeeders: feed };
  }, [b]);

  const teamSlot = (n) => ({ kind: 'team', seed: n, name: seeds?.[n] ?? null });

  // Resolve a match's display slots (filling advanced teams) + decided/winner/loser.
  // Single-elim fills ref slots from the ordered winner-feeders; double-elim resolves each
  // ref ("<Round> winner"/"<Round> loser") from the referenced match. Recursive + memoised.
  const viewCache = {};
  const matchView = (match) => {
    if (viewCache[match.id]) return viewCache[match.id];
    const res = results[match.id];
    let slots;
    if (b.layout === 'single') {
      const queue = [...(winFeeders[match.id] || [])];
      slots = match.slots.map((slot) => {
        if (slot.seed != null) return teamSlot(slot.seed);
        const fr = queue.length ? matchView(byId[queue.shift()]) : null;
        return fr && fr.decided ? teamSlot(fr.winnerSeed) : { kind: 'ref', text: slot.ref };
      });
    } else {
      slots = match.slots.map((slot) => {
        if (slot.seed != null) return teamSlot(slot.seed);
        const parsed = slot.ref.match(/^(.*)\s+(winner|loser)$/i);
        const feeder = parsed && byRound[parsed[1]];
        if (feeder && feeder.id !== match.id) {
          const fr = matchView(feeder);
          const s = fr.decided ? (parsed[2].toLowerCase() === 'winner' ? fr.winnerSeed : fr.loserSeed) : null;
          if (s != null) return teamSlot(s);
        }
        return { kind: 'ref', text: slot.ref };
      });
    }
    const decided = !!res;
    const winnerSeed = res?.winnerSeed ?? null;
    const loserSeed = decided ? (slots.map((s) => s.seed).find((x) => x != null && x !== winnerSeed) ?? null) : null;
    const view = { slots, decided, winnerSeed, loserSeed, score: res?.score, matchIds: res?.matchIds ?? [], note: res?.note ?? null };
    viewCache[match.id] = view;
    return view;
  };

  // Open a decided series and lazily load its per-game detail (cached by matchApi).
  const openSeries = async (match, view) => {
    const ids = view.matchIds || [];
    if (!ids.length) return;
    const names = view.slots.filter((s) => s.kind === 'team').map((s) => s.name);
    setSeries({ round: match.round, bo: match.bo, names, winnerName: seeds?.[view.winnerSeed] ?? null, score: view.score, note: view.note });
    setSeriesGames(null);
    setSeriesLoading(true);
    try {
      const games = await Promise.all(ids.map(async (id, i) => {
        const baked = s7PlayoffGames[id]; // committed detail — no Imprint call
        if (baked) return { ...baked, game: i + 1 };
        const raw = await fetchMatchDetails(id).catch(() => null); // fallback for un-baked ids
        return gameFromMatchDetail(raw, i + 1);
      }));
      // Apply DQ overrides: a game awarded by ruling (e.g. a forfeit/cancel) shows the
      // awarded team as the winner and a "DQ" tag, overriding Imprint's recorded winner.
      const dq = results[match.id]?.dq || {};
      setSeriesGames(games.filter((g) => g && g.parsed).map((g) => {
        const dqSeed = dq[g.matchId];
        if (dqSeed == null) return g;
        const wName = seeds?.[dqSeed] ?? null;
        return { ...g, dqWinner: wName, teams: g.teams.map((t) => ({ ...t, win: normTeamName(t.name) === normTeamName(wName) })) };
      }));
    } finally {
      setSeriesLoading(false);
    }
  };
  const closeSeries = () => { setSeries(null); setSeriesGames(null); };

  // Measure every match-to-match connector once (per layout), so the bracket wiring is
  // always visible. Hover just restyles the relevant edges; it doesn't recompute geometry.
  useLayoutEffect(() => {
    const cont = containerRef.current;
    const next = [];
    if (cont) {
      const cr = cont.getBoundingClientRect();
      Object.entries(flow).forEach(([id, f]) => {
        const src = cardRefs.current[id];
        if (!src) return;
        const sr = src.getBoundingClientRect();
        [['win', f.win], ['lose', f.lose]].forEach(([kind, targetId]) => {
          const tgt = targetId ? cardRefs.current[targetId] : null;
          if (tgt) next.push({ from: id, kind, d: edgePath(sr, tgt.getBoundingClientRect(), cr) });
        });
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- geometry measured from the DOM after layout
    setEdges(next);
  }, [flow, seeds, tick, division]);

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!b) {
    return <div className="py-10 text-center text-white/50">No playoff bracket for this division.</div>;
  }

  const highlightFor = (id) => {
    if (!hovered) return null;
    if (id === hovered) return 'source';
    const f = flow[hovered];
    if (f?.win === id) return 'win';
    if (f?.lose === id) return 'lose';
    return null;
  };
  const setRef = (id) => (el) => { if (el) cardRefs.current[id] = el; };
  const cardProps = (id) => ({
    innerRef: setRef(id),
    onEnter: () => setHovered(id),
    onLeave: () => setHovered((h) => (h === id ? null : h)),
    highlight: highlightFor(id),
  });

  const renderDouble = () => {
    const cols = b.weeks.length;
    return (
      <div className="grid gap-x-14 gap-y-6 relative z-[1]" style={{ gridTemplateColumns: `52px repeat(${cols}, minmax(180px, 1fr))` }}>
        <div style={{ gridColumn: 1, gridRow: 1 }} />
        {b.weeks.map((w) => (
          <WeekHeader key={w.n} week={w.n} dates={w.dates} style={{ gridColumn: w.n + 1, gridRow: 1 }} />
        ))}

        <LaneLabel label="Upper" tone="up" row={2} />
        <LaneLabel label="Lower" tone="lo" row={3} />

        {[['up', 2, b.upper], ['lo', 3, b.lower]].map(([tone, row, cells]) =>
          cells.map((cell, ci) => (
            <div
              key={`${tone}${ci}`}
              className="flex flex-col justify-center gap-5"
              style={{ gridColumn: cell.week + 1, gridRow: row }}
            >
              {cell.matches.map((m) => {
                const view = matchView(m);
                return <MatchCard key={m.id} match={m} tone={tone} hideSeeds={b.hideSeeds} view={view} onOpen={view.matchIds.length ? () => openSeries(m, view) : undefined} {...cardProps(m.id)} />;
              })}
            </div>
          ))
        )}

        <div className="flex flex-col justify-center" style={{ gridColumn: b.gf.week + 1, gridRow: '2 / span 2' }}>
          {(() => { const view = matchView(b.gf); return <MatchCard match={b.gf} tone="gf" hideSeeds={b.hideSeeds} view={view} onOpen={view.matchIds.length ? () => openSeries(b.gf, view) : undefined} {...cardProps(b.gf.id)} />; })()}
        </div>
      </div>
    );
  };

  const renderSingle = () => {
    const cols = b.columns.length;
    return (
      <div className="grid gap-x-14 gap-y-6 relative z-[1]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(180px, 1fr))` }}>
        {b.columns.map((col, i) => (
          <WeekHeader key={`h${i}`} week={col.week} dates={datesFor(b.weeks, col.week)} label={col.label} style={{ gridColumn: i + 1, gridRow: 1 }} />
        ))}
        {b.columns.map((col, i) => (
          <div key={`c${i}`} className="flex flex-col justify-center gap-5" style={{ gridColumn: i + 1, gridRow: 2 }}>
            {col.matches.map((m) => {
              const view = matchView(m);
              return <MatchCard key={m.id} match={m} tone={m.tone || 'up'} hideSeeds={b.hideSeeds} view={view} onOpen={view.matchIds.length ? () => openSeries(m, view) : undefined} {...cardProps(m.id)} />;
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pb-3 mb-1 border-b border-white/10">
        <h3 className="text-lg font-bold uppercase tracking-wide">{b.title} Playoffs</h3>
        <span className="text-sm text-white/60">{b.format}</span>
        <span className="text-xs text-white/40">{b.meta}</span>
        <span className="ml-auto text-xs font-medium text-primary">{b.span}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 py-3 text-[12px] text-white/55">
        {b.layout === 'double' ? (
          <>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-primary" /> Upper bracket, two losses to exit</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-accent-orange" /> Lower bracket, one loss and out</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-gradient-to-br from-primary to-accent-orange" /> Grand final, Best-of-5</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-primary" /> Single elimination, one loss and out</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-gradient-to-br from-primary to-accent-orange" /> Final, Best-of-5</span>
          </>
        )}
      </div>
      <p className="text-[11px] text-white/35 mb-1">
        {b.layout === 'double'
          ? 'Hover or tap a match to trace where its winner (green) and loser (orange) go next.'
          : 'Hover or tap a match to trace where its winner (green) advances.'}
      </p>

      {/* Bracket grid + flow arrows overlay */}
      <div className="overflow-x-auto pt-3 pb-2">
        <div ref={containerRef} className="relative" style={{ width: 'max-content' }}>
          {b.layout === 'single' ? renderSingle() : renderDouble()}

          <svg className="absolute inset-0 z-0 pointer-events-none" width="100%" height="100%">
            <defs>
              <marker id="s7ah-win" markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="#13ec5b" />
              </marker>
              <marker id="s7ah-lose" markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="#f97316" />
              </marker>
            </defs>
            {/* Neutral bracket wiring, always visible; the hovered match's edges light up */}
            {edges.map((e, i) => {
              const active = hovered === e.from;
              const dim = hovered && !active;
              const baseStroke = e.kind === 'lose' ? '#f97316' : '#ffffff';
              return (
                <path
                  key={i}
                  d={e.d}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  stroke={active ? (e.kind === 'win' ? '#13ec5b' : '#f97316') : baseStroke}
                  strokeWidth={active ? 2 : 1.25}
                  strokeOpacity={active ? 1 : dim ? 0.05 : e.kind === 'lose' ? 0.28 : 0.15}
                  markerEnd={active ? `url(#s7ah-${e.kind})` : undefined}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Series detail modal (lazy-loaded on click) */}
      {series && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:py-10"
          onClick={closeSeries}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-white/10 bg-zinc-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/10">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  {b.title} · {series.round}{series.bo ? ` · ${series.bo}` : ''}
                </div>
                <div className="mt-0.5 text-sm truncate">
                  <span className="text-primary font-semibold">{series.winnerName}</span>
                  <span className="mx-2 font-mono text-white/60">{series.score}</span>
                  <span className="text-white/70">{series.names.find((n) => n !== series.winnerName) ?? ''}</span>
                </div>
                {series.note && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-white/55">
                    <span className="material-symbols-outlined text-[14px] text-white/40 mt-px">info</span>
                    <span>{series.note}</span>
                  </div>
                )}
              </div>
              <button
                onClick={closeSeries}
                aria-label="Close"
                className="shrink-0 text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {seriesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : seriesGames && seriesGames.length ? (
              <MatchDetailPanel games={seriesGames} />
            ) : (
              <div className="py-10 text-center text-sm text-white/50">Match details unavailable.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default S7PlayoffBracket;
