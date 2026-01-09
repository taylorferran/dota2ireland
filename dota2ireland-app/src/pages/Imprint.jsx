import { useEffect, useState } from "react";
import { fetchLeaderboard, fetchHeroStatistics, fetchTeams, SEASON_LEAGUE_IDS } from "../services/leaderboardApi";

const getPositionImage = (position) => {
  const positionMap = {
    1: "/img/Carry.png",
    2: "/img/Middle.png",
    3: "/img/Offlane.png",
    4: "/img/SoftSupport.png",
    5: "/img/HardSupport.png",
  };
  return positionMap[position] || "";
};

const Imprint = () => {
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [selectedSeason, setSelectedSeason] = useState(6); // Default to Season 6
  const [players, setPlayers] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const leagueId = SEASON_LEAGUE_IDS[selectedSeason];

        if (activeTab === "leaderboard") {
          const data = await fetchLeaderboard(leagueId);
          // Use lower threshold for Season 6 since it just started
          const minMatchCount = selectedSeason === 6 ? 1 : 3;
          const filteredPlayers = data.players
            .filter((player) => player.match_count >= minMatchCount)
            .sort((a, b) => b.average_imprint_rating - a.average_imprint_rating);
          setPlayers(filteredPlayers);
        } else if (activeTab === "heroes") {
          const data = await fetchHeroStatistics(leagueId);
          setHeroes(data.hero_statistics.heroes.sort((a, b) => b.match_count - a.match_count));
        } else {
          const data = await fetchTeams(leagueId);
          setTeams(data.teams.sort((a, b) => b.average_team_imprint_rating - a.average_team_imprint_rating));
        }
      } catch (err) {
        setError(`Failed to load ${activeTab} data`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, selectedSeason]);

  const getMostPopularPosition = (hero) => {
    if (!hero.position_tally || hero.position_tally.length === 0) return null;
    return hero.position_tally.reduce((prev, current) => (current.match_count > prev.match_count ? current : prev));
  };

  const getMostPopularFacet = (hero) => {
    if (!hero.facet_tally || hero.facet_tally.length === 0) return null;
    return hero.facet_tally.reduce((prev, current) => (current.match_count > prev.match_count ? current : prev));
  };

  const renderLeaderboard = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-zinc-900 border-b border-primary/30">
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Player</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Position</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Rating</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Team</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Win Rate</th>
          </tr>
        </thead>
        <tbody className="bg-zinc-900 divide-y divide-white/10">
          {players.map((player, index) => (
            <tr
              key={player.account_id}
              className="hover:bg-white/5 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{player.account_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <img
                  src={getPositionImage(player.position)}
                  alt={`Position ${player.position}`}
                  className="w-6 h-6 inline-block"
                  title={`Position ${player.position}`}
                  loading="lazy"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-primary">
                {player.average_imprint_rating.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                <div className="flex items-center gap-2">
                  <img src={player.team.team_logo_src} alt={player.team.team_name} className="w-6 h-6 object-contain" loading="lazy" />
                  {player.team.team_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-white">
                {player.win_rate} ({player.wins}/{player.losses})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderHeroStats = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-zinc-900 border-b border-primary/30">
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Hero</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Matches</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Win Rate</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Avg Rating</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Position</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Facet</th>
          </tr>
        </thead>
        <tbody className="bg-zinc-900 divide-y divide-white/10">
          {heroes.map((hero, index) => {
            const mostPopularPosition = getMostPopularPosition(hero);
            const mostPopularFacet = getMostPopularFacet(hero);

            return (
              <tr key={hero.raw_name} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <div className="flex items-center gap-3">
                    <img src={hero.icon_src} alt={hero.name} className="w-8 h-8 rounded" title={hero.name} loading="lazy" />
                    <span className="font-medium">{hero.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-white">{hero.match_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-white">
                  <span className={hero.wins > hero.losses ? "text-green-400" : "text-red-400"}>{hero.win_rate}</span>
                  <div className="text-xs text-white/60">
                    ({hero.wins}W/{hero.losses}L)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-primary">
                  {hero.average_imprint_rating.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {mostPopularPosition ? (
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={getPositionImage(mostPopularPosition.position)}
                        alt={`Position ${mostPopularPosition.position}`}
                        className="w-6 h-6"
                        title={`Position ${mostPopularPosition.position}`}
                        loading="lazy"
                      />
                      <span className="text-xs text-white/60">{mostPopularPosition.match_count}</span>
                    </div>
                  ) : (
                    <span className="text-white/40">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {mostPopularFacet ? (
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={mostPopularFacet.icon_src}
                        alt={mostPopularFacet.name}
                        className="w-6 h-6 rounded"
                        title={mostPopularFacet.name}
                        loading="lazy"
                      />
                      <span className="text-xs text-white/60">{mostPopularFacet.match_count}</span>
                    </div>
                  ) : (
                    <span className="text-white/40">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderTeams = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-zinc-900 border-b border-primary/30">
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Team</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Matches</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Win Rate</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">Avg Rating</th>
          </tr>
        </thead>
        <tbody className="bg-zinc-900 divide-y divide-white/10">
          {teams.map((team, index) => (
            <tr key={team.team_id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                <div className="flex items-center gap-3">
                  <img src={team.team_logo_src} alt={team.team_name} className="w-8 h-8 rounded" title={team.team_name} loading="lazy" />
                  <span className="font-medium">{team.team_name}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-white">{team.match_count}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-white">
                <span className={team.wins > team.losses ? "text-green-400" : "text-red-400"}>{team.win_rate}</span>
                <div className="text-xs text-white/60">
                  ({team.wins}W/{team.losses}L)
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-primary">
                {team.average_team_imprint_rating.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-zinc-900 rounded-lg shadow-lg p-8 border border-white/10">
          {/* Header */}
          <div className="text-center space-y-6 mb-8">
            <h1 className="text-4xl font-black text-primary tracking-wider">
              Imprint Leaderboard (IDL Season {selectedSeason})
            </h1>

            {/* Season Selector */}
            <div className="flex flex-wrap justify-center items-center gap-3">
              <button
                onClick={() => setSelectedSeason(6)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  selectedSeason === 6
                    ? "bg-primary text-black shadow-lg shadow-primary/30"
                    : "bg-zinc-800 text-white/70 hover:text-white hover:bg-zinc-700"
                }`}
              >
                Season 6
              </button>
              <button
                onClick={() => setSelectedSeason(5)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  selectedSeason === 5
                    ? "bg-primary text-black shadow-lg shadow-primary/30"
                    : "bg-zinc-800 text-white/70 hover:text-white hover:bg-zinc-700"
                }`}
              >
                Season 5 (Archive)
              </button>

              <div className="w-px h-8 bg-white/20 hidden sm:block"></div>

              {/* Tab Navigation */}
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === "leaderboard"
                    ? "bg-primary text-black shadow-lg shadow-primary/30"
                    : "bg-zinc-800 text-white/70 hover:text-white hover:bg-zinc-700"
                }`}
              >
                Players
              </button>
              <button
                onClick={() => setActiveTab("heroes")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === "heroes"
                    ? "bg-primary text-black shadow-lg shadow-primary/30"
                    : "bg-zinc-800 text-white/70 hover:text-white hover:bg-zinc-700"
                }`}
              >
                Heroes
              </button>
              <button
                onClick={() => setActiveTab("teams")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === "teams"
                    ? "bg-primary text-black shadow-lg shadow-primary/30"
                    : "bg-zinc-800 text-white/70 hover:text-white hover:bg-zinc-700"
                }`}
              >
                Teams
              </button>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <a
                href="https://imprint.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">language</span>
                <span className="text-sm font-medium">Visit Imprint.gg</span>
              </a>

              <a
                href="https://x.com/ImprintEsports_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-sm font-medium">Follow on X</span>
              </a>

              <a
                href="https://www.instagram.com/ImprintEsports/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="text-sm font-medium">Follow on Instagram</span>
              </a>

              <a
                href="https://www.facebook.com/people/Imprint-Esports/61563195342615/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium">Follow on Facebook</span>
              </a>

              <a
                href="https://www.linkedin.com/company/imprintesports/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm font-medium">Connect on LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
            </div>
          ) : activeTab === "leaderboard" ? (
            renderLeaderboard()
          ) : activeTab === "heroes" ? (
            renderHeroStats()
          ) : (
            renderTeams()
          )}
        </div>
      </div>
    </main>
  );
};

export default Imprint;

