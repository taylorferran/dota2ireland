// Per-game series breakdown: each game's players, heroes, K/D/A, Imprint score, the
// winning team, and a Dotabuff link. Shared by the group-stage calendar (S7MatchCalendar)
// and the playoff bracket (S7PlayoffBracket). Expects a `games` array of the shape produced
// by indexSeries / gameFromMatchDetail in utils/s7Results.js.

function PlayerRow({ p }) {
  // Prefer the square minimap icon; fall back to the rectangular portrait, then hide
  // the broken image entirely so the hero name text still shows.
  const handleImgError = (e) => {
    const img = e.currentTarget;
    if (p.heroPortrait && img.src !== p.heroPortrait) {
      img.src = p.heroPortrait;
    } else {
      img.style.display = 'none';
    }
  };
  const heroImg = p.heroIcon || p.heroPortrait;
  return (
    <div className="flex items-center px-2 py-1 rounded hover:bg-white/[0.03]">
      <span className="flex items-center gap-2 flex-1 min-w-0">
        {heroImg && (
          <img
            src={heroImg}
            alt={p.hero ?? ''}
            title={p.hero ?? ''}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImgError}
            className="w-8 h-8 object-cover rounded shrink-0 bg-black/40"
          />
        )}
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-white/90 text-sm">{p.name}</span>
          <span className="block truncate text-white/40 text-xs">{p.hero ?? 'Unknown'}</span>
        </span>
      </span>
      <span className="w-24 text-center font-mono text-xs text-white/60">
        {p.kills}<span className="text-white/30">/</span>{p.deaths}<span className="text-white/30">/</span>{p.assists}
      </span>
      <span className="w-14 text-right font-mono text-xs text-white/50" title="Imprint score">
        {p.rating != null ? p.rating : '—'}
      </span>
    </div>
  );
}

export function MatchDetailPanel({ games }) {
  const list = (games ?? []).filter((g) => g.parsed && Array.isArray(g.teams) && g.teams.length);
  if (!list.length) return null;

  return (
    <div className="bg-black/30 border-t border-white/5 px-3 py-3 space-y-3">
      {list.map((g) => (
        <div key={g.matchId ?? g.game} className="rounded-md bg-white/[0.03] border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02]">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Game {g.game}</span>
            <div className="flex items-center gap-3">
              {g.duration && <span className="text-xs font-mono text-white/40">{g.duration}</span>}
              {g.matchId && (
                <a
                  href={`https://www.dotabuff.com/matches/${g.matchId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Dotabuff
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>
          </div>

          {g.teams.map((t) => (
            <div key={t.teamId} className="border-t border-white/5">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${t.win ? 'text-primary font-medium' : 'text-white/80'}`}>
                {t.win && <span className="material-symbols-outlined text-base">trophy</span>}
                <span className="truncate">{t.name}</span>
              </div>
              {(t.players?.length ?? 0) > 0 && (
                <div className="px-2 pb-2">
                  <div className="flex items-center px-2 py-1 text-[10px] uppercase tracking-wide text-white/30">
                    <span className="flex-1">Player / Hero</span>
                    <span className="w-24 text-center">K / D / A</span>
                    <span className="w-14 text-right">Imprint</span>
                  </div>
                  {t.players.map((p) => <PlayerRow key={p.accountId} p={p} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default MatchDetailPanel;
