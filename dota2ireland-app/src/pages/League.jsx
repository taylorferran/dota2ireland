import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { supabase } from '../lib/supabase';
import { divisionMatches as season4Matches } from '../data/matchData';
import { divisionMatches as season5Matches } from '../data/matchDataSeason5';
import { KnockoutBracket } from '../components/KnockoutBracket';
import { AddTeamForm } from '../components/AddTeamForm';
import { JoinTeamForm } from '../components/JoinTeamForm';
import { LFTForm } from '../components/LFTForm';
import { useMyTeam } from '../hooks/useMyTeam';

// Team name mappings
const season4TeamNames = {
  monkey_kings: "Monkey Kings",
  wongs_bakery: "Wongs Bakery馬戲團",
  the_standins: "The Standins",
  joonsquad: "Joonsquad: Extrajoondicial Violence",
  team_secret: "Team Secret",
  bye_week: "Bye Week",
  taylors_angels: "Taylor's Angels",
  kobold_camp: "Kobold Camp",
  cavan_champions: "Cavan Champions",
  stinky_steve: "Stinky Steve",
  creep_enjoyers: "Creep Enjoyers",
  void: "VOID",
  dans_crusty_socks: "Dan's Crusty Socks",
  imprint_esports: "Imprint Esports",
  passport_issues: "Passport Issues",
  andy_archons: "Andy Archons",
  no_discord: "No Discord",
};

const season5TeamNames = {
  joonsquad: "Joonsquad: Extrajoondicial Violence",
  mms: "M&M's",
  mouseys_fierce_warriors: "Mousey's Fierce Warriors",
  sentinel_island_esports: "Sentinel Island Esports",
  wongs_bakery: "Wongs Bakery馬戲團",
  bdc: "BDC",
  creep_enjoyers: "Creep Enjoyers",
  fear_the_samurai: "Fear the Samurai",
  lughs_last_hitters: "Lugh's Last Hitters",
  mikes_army: "Mike's Army",
  team_lft: "Team LFT",
  cavan_champions: "Cavan Champions",
  cavan_chumpions: "Cavan Chumpions",
  ausgang: "Ausgang",
  imprint_esports: "Imprint Esports",
  border_control: "Border Control",
  passport_issues: "Passport Issues",
  ratatataouille: "Ratatataouille",
  bye_week: "Bye Week",
};

const League = () => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const { team: myTeam, loading: myTeamLoading } = useMyTeam();
  const [selectedSeason, setSelectedSeason] = useState(5);
  const [selectedDivision, setSelectedDivision] = useState(1);
  const [selectedView, setSelectedView] = useState('standings'); // standings, rosters, lft, matches
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [standingsView, setStandingsView] = useState('group'); // 'group' or 'knockout'
  const [season6Form, setSeason6Form] = useState(null); // 'register', 'join', 'lft', or null
  const [teams, setTeams] = useState([]);
  const [lftPlayers, setLftPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get match data based on selected season
  const matchData = selectedSeason === 4 ? season4Matches : season5Matches;
  const teamNamesMap = selectedSeason === 4 ? season4TeamNames : season5TeamNames;
  const divisionMatchData = matchData[selectedDivision] || [];
  
  // Get max week for matches
  const maxWeek = divisionMatchData.length > 0 
    ? Math.max(...divisionMatchData.map(m => m.week))
    : 1;

  const seasons = [
    { id: 4, name: 'Season 4', active: true },
    { id: 5, name: 'Season 5', active: true },
    { id: 6, name: 'Season 6', active: true, upcoming: true },
  ];

  const divisions = [
    { id: 1, name: 'Division 1' },
    { id: 2, name: 'Division 2' },
    { id: 3, name: 'Division 3' },
  ];

  const views = [
    { id: 'standings', name: 'Standings' },
    { id: 'matches', name: 'Matches' },
    { id: 'rosters', name: 'Team Rosters' },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSeason, selectedDivision]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Determine which table to use based on season
      const teamsTable = selectedSeason === 4 ? 'teams_duplicate' : selectedSeason === 6 ? 'teams_s6' : 'teams';
      
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from(teamsTable)
        .select('*')
        .order('division_id', { ascending: true })
        .order('points', { ascending: false });

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        setTeams([]);
      } else {
        // Parse the players field if it exists
        const parsedTeams = (teamsData || []).map((team) => {
          try {
            return {
              ...team,
              players: team.players ? team.players.map((player) => {
                if (typeof player === 'string') {
                  return JSON.parse(player);
                }
                return player;
              }) : []
            };
          } catch (e) {
            console.error('Error parsing team players:', e);
            return team;
          }
        });
        setTeams(parsedTeams);
      }

      // Matches are loaded from static data files (matchDataSeason4.js / matchDataSeason5.js)

      // Fetch LFT players
      const { data: lftData, error: lftError } = await supabase
        .from('lft_players')
        .select('*')
        .order('created_at', { ascending: false });

      if (lftError) {
        console.error('Error fetching LFT players:', lftError);
        setLftPlayers([]);
      } else {
        setLftPlayers(lftData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentTeams = teams.filter((team) => team.division_id === selectedDivision);
  const sortedTeams = [...currentTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.draws !== a.draws) return b.draws - a.draws;
    return a.losses - b.losses;
  });

  const getTeamName = (teamId) => teamNamesMap[teamId] || teamId;

  // Render knockout brackets using ReactFlow component
  const renderKnockoutBrackets = () => {
    return (
      <div className="pb-8">
        <KnockoutBracket 
          teams={sortedTeams}
          division={selectedDivision}
          season={selectedSeason}
        />
      </div>
    );
  };

  // Render matches schedule with week selector
  const renderMatches = () => {
    const weekMatches = divisionMatchData.filter(m => m.week === selectedWeek && !m.isByeWeek);
    
    return (
      <div className="space-y-6">
        {/* Week Selector */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
            disabled={selectedWeek === 1}
            className="px-4 py-2 bg-white/10 text-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            ← Previous Week
          </button>
          <div className="text-white font-bold">
            Week {selectedWeek}
            {divisionMatchData.find(m => m.week === selectedWeek && m.isKnockout) && (
              <span className="ml-2 text-primary text-sm">(Knockout)</span>
            )}
          </div>
          <button
            onClick={() => setSelectedWeek(Math.min(maxWeek, selectedWeek + 1))}
            disabled={selectedWeek === maxWeek}
            className="px-4 py-2 bg-white/10 text-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            Next Week →
          </button>
        </div>

        {/* Matches for selected week */}
        <div className="space-y-4">
          {weekMatches.length === 0 ? (
            <div className="text-center text-white/60 py-8">No matches for this week</div>
          ) : (
            weekMatches.map((match) => (
              <div key={match.id} className="bg-zinc-800 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 text-center md:text-right pr-4">
                    <div className={`text-white font-medium ${match.score && match.score[0] > match.score[1] ? 'text-primary' : ''}`}>
                      {getTeamName(match.team1Id)}
                    </div>
                  </div>
                  <div className="px-6 text-center min-w-[100px]">
                    {match.completed && match.score ? (
                      <div className="text-primary font-bold text-xl">
                        {match.score[0]} - {match.score[1]}
                      </div>
                    ) : (
                      <div className="text-white/60 font-bold">vs</div>
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left pl-4">
                    <div className={`text-white font-medium ${match.score && match.score[1] > match.score[0] ? 'text-primary' : ''}`}>
                      {getTeamName(match.team2Id)}
                    </div>
                  </div>
                </div>
                <div className="text-center text-white/60 text-sm">
                  {new Date(match.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                {match.games && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {Object.entries(match.games).map(([gameKey, game]) => (
                        game.played && (
                          <div key={gameKey} className="bg-zinc-900 p-2 rounded text-center">
                            <span className="text-white/60">{gameKey.replace('game', 'Game ')}: </span>
                            <span className="text-primary">{getTeamName(game.winner)}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Parse player data from JSON strings or objects
  const parsePlayerData = (playersArray) => {
    if (!playersArray || playersArray.length === 0) return [];
    
    return playersArray.map(player => {
      try {
        // If it's already an object, return it
        if (typeof player === 'object' && player !== null) {
          return player;
        }
        // If it's a string, parse it
        if (typeof player === 'string') {
          return JSON.parse(player);
        }
        return null;
      } catch (e) {
        console.error('Failed to parse player data:', e, player);
        return null;
      }
    }).filter(Boolean);
  };

  // Render team rosters - 3 per row, compact vertical layout
  const renderRosters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedTeams.length === 0 ? (
        <div className="col-span-full text-center text-white/60 py-8">No teams registered</div>
      ) : (
        sortedTeams.map((team) => {
          const players = parsePlayerData(team.players || []);
          
          return (
            <div key={team.id} className="bg-zinc-800 rounded-lg border border-white/10 overflow-hidden">
              {/* Team Header */}
              <div className="bg-zinc-900 p-4 border-b border-white/10">
                <h3 className="text-white font-bold text-lg mb-1">{team.name}</h3>
                {team.captain_name && (
                  <div className="text-xs text-white/60">
                    Captain: <span className="text-primary">{team.captain_name}</span>
                  </div>
                )}
              </div>
              
              {/* Players Table */}
              {players.length === 0 ? (
                <div className="text-white/60 text-sm text-center py-6">No players yet</div>
              ) : (
                <div className="p-3">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs text-white/60 uppercase pb-2 px-2">Player</th>
                        <th className="text-center text-xs text-white/60 uppercase pb-2 px-2">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player, index) => (
                        <tr key={index} className="border-b border-white/5 last:border-0">
                          <td className="py-2 px-2">
                            {player.steamProfile && player.steamProfile !== 'https://steamcommunity.com/my/' ? (
                              <a
                                href={player.steamProfile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors text-sm flex items-center gap-1"
                              >
                                {player.name}
                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                              </a>
                            ) : (
                              <div className="text-white text-sm">{player.name}</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded inline-block">
                              {player.rank || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // Render LFT players
  const renderLFT = () => (
    <div className="space-y-3">
      {lftPlayers.length === 0 ? (
        <div className="text-center text-white/60 py-8">No LFT players available</div>
      ) : (
        lftPlayers.map((player, index) => (
          <div key={index} className="bg-zinc-900 p-4 rounded-lg border border-white/10">
            <div className="flex flex-wrap items-center gap-4">
              {/* Name and Rank */}
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="text-white font-bold">{player.name}</div>
                <div className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                  {player.rank}
                </div>
              </div>
              
              {/* Positions */}
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Positions:</span>
                <span className="text-white text-sm">
                  {Array.isArray(player.roles) ? player.roles.join(', ') : player.roles || 'Flexible'}
                </span>
              </div>
              
              {/* Links */}
              <div className="flex gap-2 ml-auto">
                {player.steamProfile && player.steamProfile !== 'https://steamcommunity.com/my/' && (
                  <a
                    href={player.steamProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded transition-colors"
                  >
                    Steam
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
                {player.dotabuffProfile && player.dotabuffProfile !== 'https://www.dotabuff.com/players/' && (
                  <a
                    href={player.dotabuffProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded transition-colors"
                  >
                    Dotabuff
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
            
            {/* Notes on separate line if exists */}
            {player.notes && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-white/60 text-xs">Notes: </span>
                <span className="text-white/80 text-xs">{player.notes}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <main className="flex-1">
      {/* Hero Section with Auth */}
      <section className="py-8 md:py-12">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-white text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em]">
              IRISH DOTA LEAGUE
            </h1>
            <p className="text-white/60 text-lg mt-2">
              Compete with the best Irish Dota 2 teams
            </p>
          </div>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-white/60 text-sm hidden md:block">{user?.name || user?.email}</span>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="px-6 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="px-6 py-2 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Season Selector */}
      <section className="py-4">
        <div className="flex flex-wrap gap-2 mb-6">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedSeason === season.id
                  ? 'bg-primary text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {season.name}
              {season.upcoming && <span className="ml-2 text-xs">(Registration Open)</span>}
            </button>
          ))}
        </div>

        {/* Division Selector - Only show for Season 4 & 5 */}
        {selectedSeason !== 6 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {divisions.map((division) => (
              <button
                key={division.id}
                onClick={() => setSelectedDivision(division.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDivision === division.id
                    ? 'bg-primary/20 text-primary border border-primary'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {division.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Season 6 Registration Options */}
      {selectedSeason === 6 && (
        <section className="py-4 mb-8">
          {!season6Form ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Register Team */}
              <div className="bg-gradient-to-br from-primary/10 to-zinc-900 border border-primary/50 rounded-lg p-6">
                <h2 className="text-white text-2xl font-bold mb-3">Register Team</h2>
                <p className="text-white/70 mb-4">
                  Create and register a new team for Season 6.

                </p>
                <div className="space-y-3">
                  {isAuthenticated ? (
                    <button 
                      onClick={() => setSeason6Form('register')}
                      className="px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all w-full"
                    >
                      Register Your Team
                    </button>
                  ) : (
                    <button 
                      onClick={() => loginWithRedirect()}
                      className="px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all w-full"
                    >
                      Sign In to Register
                    </button>
                  )}
                  {isAuthenticated && (
                    <button 
                      onClick={() => setSeason6Form('viewmyteam')}
                      className="px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all w-full"
                    >
                      View My Team
                    </button>
                  )}
                </div>
              </div>

              {/* Join Team */}
              <div className="bg-gradient-to-br from-primary/10 to-zinc-900 border border-primary/50 rounded-lg p-6">
                <h2 className="text-white text-2xl font-bold mb-3">Join Team</h2>
                <p className="text-white/70 mb-4">
                  Get your team ID from your captain, and join the team here.
                </p>
                <div className="space-y-3">
                  {isAuthenticated ? (
                    <button 
                      onClick={() => setSeason6Form('join')}
                      className="px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all w-full"
                    >
                      Join a Team
                    </button>
                  ) : (
                    <button 
                      onClick={() => loginWithRedirect()}
                      className="px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all w-full"
                    >
                      Sign In to Join
                    </button>
                  )}
                  <button 
                    onClick={() => setSeason6Form('viewteams')}
                    className="px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all w-full"
                  >
                    View Teams
                  </button>
                </div>
              </div>

              {/* Looking for Team */}
              <div className="bg-gradient-to-br from-primary/10 to-zinc-900 border border-primary/50 rounded-lg p-6">
                <h2 className="text-white text-2xl font-bold mb-3">Looking for Team</h2>
                <p className="text-white/70 mb-4">
                  Post your profile to let team captains know you're available to play.
                </p>
                <div className="space-y-3">
                  {isAuthenticated ? (
                    <button 
                      onClick={() => setSeason6Form('lft')}
                      className="px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all w-full"
                    >
                      LFT Form
                    </button>
                  ) : (
                    <button 
                      onClick={() => loginWithRedirect()}
                      className="px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all w-full"
                    >
                      Sign In to Post
                    </button>
                  )}
                  <button 
                    onClick={() => setSeason6Form('viewlft')}
                    className="px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all w-full"
                  >
                    View LFT
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Back button */}
              <button
                onClick={() => setSeason6Form(null)}
                className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Season 6
              </button>

              {/* Render appropriate form or view */}
              {season6Form === 'register' && <AddTeamForm divisionId={selectedDivision} />}
              {season6Form === 'join' && <JoinTeamForm />}
              {season6Form === 'lft' && <LFTForm />}
              {season6Form === 'viewlft' && (
                <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
                  <h2 className="text-2xl font-bold mb-6 text-white">Looking for Team Players</h2>
                  {renderLFT()}
                </div>
              )}
              {season6Form === 'viewteams' && (
                <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
                  <h2 className="text-2xl font-bold mb-6 text-white">Season 6 Teams</h2>
                  {renderRosters()}
                </div>
              )}
              {season6Form === 'viewmyteam' && (
                <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
                  {myTeamLoading ? (
                    <div className="text-center text-white/60 py-8">Loading...</div>
                  ) : !myTeam ? (
                    <div className="text-center py-8">
                      <h2 className="text-2xl font-bold mb-4 text-white">You're Not on a Team Yet</h2>
                      <p className="text-white/60 mb-6">
                        Register a new team or join an existing one to participate in Season 6.
                      </p>
                      <button
                        onClick={() => setSeason6Form(null)}
                        className="px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
                      >
                        Back to Options
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 text-white">My Team</h2>
                      
                      {/* Team Info */}
                      <div className="bg-zinc-900 rounded-lg p-6 mb-6 border border-primary/30">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-white font-bold text-xl">{myTeam.name}</h3>
                          </div>
                          {myTeam.image_url && (
                            <img 
                              src={myTeam.image_url} 
                              alt={myTeam.name} 
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                        </div>

                        {/* Show Team ID if user is captain (first player) */}
                        {user && myTeam.players && myTeam.players[0]?.auth_id === user.sub && (
                          <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-primary text-sm font-medium mb-1">Team ID (Share with players to join)</p>
                                <p className="text-white font-mono text-lg">{myTeam.id}</p>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(myTeam.id);
                                  alert('Team ID copied to clipboard!');
                                }}
                                className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/80 transition-colors text-sm font-medium"
                              >
                                Copy ID
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Players List */}
                      <div className="bg-zinc-900 rounded-lg p-6 border border-white/10">
                        <h4 className="text-white font-bold text-lg mb-4">Team Roster</h4>
                        <div className="space-y-3">
                          {myTeam.players && myTeam.players.map((player, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-white/10">
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="text-white font-medium">
                                    {player.name}
                                    {index === 0 && <span className="ml-2 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">Captain</span>}
                                  </div>
                                  <div className="text-white/60 text-sm mt-1">
                                    {player.position} • {player.rank}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {player.steamProfile && player.steamProfile !== 'https://steamcommunity.com/my/' && (
                                  <a
                                    href={player.steamProfile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                                  >
                                    Steam
                                  </a>
                                )}
                                {player.dotabuffProfile && player.dotabuffProfile !== 'https://www.dotabuff.com/players/' && (
                                  <a
                                    href={player.dotabuffProfile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                                  >
                                    Dotabuff
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* View Selector */}
      {selectedSeason !== 6 && (
        <section className="py-4">
          <div className="bg-zinc-900 rounded-lg shadow-md p-6 border border-white/10">
            <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
              <div className="flex gap-2">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view.id)}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedView === view.id
                        ? 'bg-primary text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {view.name}
                  </button>
                ))}
              </div>
              
              {/* Group Stage / Playoffs Toggle - shown only in Standings view */}
              {selectedView === 'standings' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setStandingsView('group')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      standingsView === 'group'
                        ? 'bg-primary text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Group Stage
                  </button>
                  <button
                    onClick={() => setStandingsView('knockout')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      standingsView === 'knockout'
                        ? 'bg-primary text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Playoffs
                  </button>
                </div>
              )}
            </div>

            {selectedView === 'standings' && (
              <>
                {/* Group Stage Table */}
                {standingsView === 'group' && (
                  <div className="mb-8">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-primary/30">
                            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase">Pos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase">Team</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase">P</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase">W</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase">D</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase">L</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-primary uppercase">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {loading ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-8 text-center">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                              </td>
                            </tr>
                          ) : sortedTeams.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 text-center text-white/60">
                                No teams registered yet
                              </td>
                            </tr>
                          ) : (
                            sortedTeams.map((team, index) => (
                              <tr key={team.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-center whitespace-nowrap text-white font-medium">
                                  {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                                  {team.name}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap text-white/80">
                                  {team.wins + team.draws + team.losses}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap text-white/80">
                                  {team.wins}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap text-white/80">
                                  {team.draws}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap text-white/80">
                                  {team.losses}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap font-bold text-primary">
                                  {team.points}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Knockout Brackets */}
                {standingsView === 'knockout' && renderKnockoutBrackets()}
              </>
            )}

            {selectedView === 'matches' && renderMatches()}
            {selectedView === 'rosters' && renderRosters()}
          </div>
        </section>
      )}
    </main>
  );
};

export default League;
