import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { supabase, getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { divisionMatches as season4Matches } from '../data/matchData';
import { divisionMatches as season5Matches } from '../data/matchDataSeason5';
import { divisionMatches as season6Matches } from '../data/matchDataSeason6';
import { KnockoutBracket } from '../components/KnockoutBracket';
import { AddTeamForm } from '../components/AddTeamForm';
import { JoinTeamForm } from '../components/JoinTeamForm';
import { LFTForm } from '../components/LFTForm';
import { useMyTeam } from '../hooks/useMyTeam';
import { fetchMatchDetails } from '../services/matchApi';
import { getTeamImagePath, getTeamInitial } from '../utils/teamImages';

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

const season6TeamNames = {
  // Division 1
  wongs_bakery: "Wong's Bakery",
  skiddys_angels: "Skiddy's Angels",
  sentinel_island_esports: "Sentinel Island Esports",
  no_tormentor: "No Tormentor",
  the_pepegs: "The Pepegs",
  // Division 2
  joon_squad_junior: "Joon Squad: Junior",
  creep_enjoyers: "Creep Enjoyers",
  bdc: "BDC",
  washed_rejected: "Washed & Rejected",
  i_do_revenge: "I DO: REVENGE",
  // Division 3
  imprint_esports: "Imprint Esports",
  green_isle_gaming: "Green Isle Gaming",
  motion_of_the_roshan: "Motion of the roshan",
  ausgang: "Ausgang",
  d2ire_rejects: "D2Ire Rejects",
  passport_issues: "Passport Issues",
  // Division 4
  five_stuns_no_brain: "5 stuns no brain",
  bord_na_mona: "Bord Na Mona",
  cavan_creche: "Cavan Creche",
  team_sosal: "Team Sosal",
  herald_hall_of_fame: "Herald Hall of Fame",
  // Placeholders
  bye_week: "Bye Week",
  seed1_d1: "1st Place",
  seed2_d1: "2nd Place",
  seed3_d1: "3rd Place",
  seed4_d1: "4th Place",
  seed1_d2: "1st Place",
  seed2_d2: "2nd Place",
  seed3_d2: "3rd Place",
  seed4_d2: "4th Place",
  seed1_d3: "1st Place",
  seed2_d3: "2nd Place",
  seed3_d3: "3rd Place",
  seed4_d3: "4th Place",
  seed1_d4: "1st Place",
  seed2_d4: "2nd Place",
  seed3_d4: "3rd Place",
  seed4_d4: "4th Place",
  winner_d1w6m1: "Winner SF1",
  winner_d1w6m2: "Winner SF2",
  winner_d2w6m1: "Winner SF1",
  winner_d2w6m2: "Winner SF2",
  winner_d3w6m1: "Winner SF1",
  winner_d3w6m2: "Winner SF2",
  winner_d4w6m1: "Winner SF1",
  winner_d4w6m2: "Winner SF2",
};

const League = () => {
  const { season: seasonParam, divisionOrView, view: viewParam } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const { supabaseToken } = useAuth();
  const { team: myTeam, loading: myTeamLoading, mutate: mutateMyTeam } = useMyTeam();
  
  // Parse URL params to derive state
  const selectedSeason = useMemo(() => {
    if (!seasonParam) return 6;
    const match = seasonParam.match(/^s(\d+)$/);
    return match ? parseInt(match[1]) : 6;
  }, [seasonParam]);

  // For season 6, check if divisionOrView is a form/view or a division
  const season6Form = useMemo(() => {
    if (selectedSeason !== 6) return null;
    if (!divisionOrView) return null;
    // Map URL path to form state
    const formMap = { 
      lft: 'viewlft', 
      join_team: 'join', 
      my_team: 'viewmyteam', 
      teams: 'viewteams',
      register: 'register',
      lft_form: 'lft'
    };
    return formMap[divisionOrView] || null;
  }, [divisionOrView, selectedSeason]);

  // For seasons 4, 5, & 6 divisionOrView is division (d1, d2, d3, d4)
  // But for season 6, also check if it's a form route
  const selectedDivision = useMemo(() => {
    if (selectedSeason === 6 && season6Form) return 1; // Default to Division 1 if showing a form
    if (!divisionOrView) return 1;
    const match = divisionOrView.match(/^d(\d+)$/);
    return match ? parseInt(match[1]) : 1;
  }, [divisionOrView, selectedSeason, season6Form]);

  // For seasons 4, 5, & 6 view is standings, matches, or teams
  const selectedView = useMemo(() => {
    if (selectedSeason === 6 && season6Form) return 'standings'; // Default view if showing a form
    if (!viewParam) return 'standings';
    // Map URL path to view id
    const viewMap = { standings: 'standings', matches: 'matches', teams: 'rosters' };
    return viewMap[viewParam] || 'standings';
  }, [viewParam, selectedSeason, season6Form]);

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [standingsView, setStandingsView] = useState('group'); // 'group' or 'knockout'
  const [teams, setTeams] = useState([]);
  const [lftPlayers, setLftPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamImage, setNewTeamImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Navigation helpers
  const navigateToSeason = (seasonId) => {
    navigate(`/league/s${seasonId}/d1/standings`);
  };

  const navigateToDivision = (divisionId) => {
    navigate(`/league/s${selectedSeason}/d${divisionId}/${viewParam || 'standings'}`);
  };

  const navigateToView = (viewId) => {
    // Map view id to URL path
    const viewMap = { standings: 'standings', matches: 'matches', rosters: 'teams' };
    navigate(`/league/s${selectedSeason}/d${selectedDivision}/${viewMap[viewId]}`);
  };

  const navigateToSeason6Form = (formId) => {
    if (!formId) {
      navigate('/league/s6');
      return;
    }
    // Map form state to URL path
    const formMap = { 
      register: 'register', 
      join: 'join_team', 
      lft: 'lft_form',
      viewlft: 'lft', 
      viewteams: 'teams', 
      viewmyteam: 'my_team' 
    };
    navigate(`/league/s6/${formMap[formId]}`);
  };

  // Get match data based on selected season
  const matchData = selectedSeason === 4 ? season4Matches : selectedSeason === 5 ? season5Matches : season6Matches;
  const teamNamesMap = selectedSeason === 4 ? season4TeamNames : selectedSeason === 5 ? season5TeamNames : season6TeamNames;
  const divisionMatchData = matchData[selectedDivision] || [];
  
  // Get max week for matches
  const maxWeek = divisionMatchData.length > 0 
    ? Math.max(...divisionMatchData.map(m => m.week))
    : 1;

  const seasons = [
    { id: 4, name: 'Season 4', active: true },
    { id: 5, name: 'Season 5', active: true },
    { id: 6, name: 'Season 6', active: true },
  ];

  const divisions = [
    { id: 1, name: 'Division 1' },
    { id: 2, name: 'Division 2' },
    { id: 3, name: 'Division 3' },
    { id: 4, name: 'Division 4' },
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
            weekMatches.map((match) => {
              // Check if any game in this match is expanded
              const expandedGameEntry = match.games && Object.entries(match.games).find(([gameKey, game]) => {
                if (!game.played || !game.dota2MatchId) return false;
                const gameId = `${game.dota2MatchId}-${gameKey}`;
                return selectedGameId === gameId;
              });
              const hasExpandedGame = !!expandedGameEntry;
              const [expandedGameKey] = expandedGameEntry || [];

              return (
                <div key={match.id} className="bg-zinc-800 rounded-lg border border-white/10 overflow-hidden">
                  <div className="p-4">
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
                    <div className="text-center text-white/60 text-sm mb-3">
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
                          {Object.entries(match.games).map(([gameKey, game]) => {
                            if (!game.played || !game.dota2MatchId) return null;
                            const gameId = `${game.dota2MatchId}-${gameKey}`;
                            const isExpanded = selectedGameId === gameId;
                            
                            return (
                              <div 
                                key={gameKey}
                                onClick={() => handleGameClick(game.dota2MatchId, gameKey)}
                                className={`bg-zinc-900 p-2 rounded text-center cursor-pointer hover:bg-zinc-700 transition-colors ${
                                  isExpanded ? 'ring-2 ring-primary' : ''
                                }`}
                              >
                                <span className="text-white/60">{gameKey.replace('game', 'Game ')}: </span>
                                <span className="text-primary">{getTeamName(game.winner)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Match Details Section - Full Width Below */}
                  {hasExpandedGame && (
                    <div className="border-t border-white/10 bg-zinc-900 p-6">
                      {loadingMatch ? (
                        <div className="text-center text-white/60 py-8">Loading match details...</div>
                      ) : matchDetails?.error ? (
                        <div className="text-center text-red-400 py-8">{matchDetails.error}</div>
                      ) : matchDetails ? (
                        <div className="space-y-6">
                          {/* Match Header */}
                          <div className="text-center">
                            <div className="text-white/60 text-sm mb-2">
                              {expandedGameKey.replace('game', 'Game ')} • Duration: {matchDetails.duration}
                            </div>
                          </div>

                          {/* Teams */}
                          {matchDetails.teams.map((team, teamIndex) => (
                            <div key={teamIndex} className="space-y-3">
                              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className={`font-bold text-lg ${team.win ? 'text-primary' : 'text-white'}`}>
                                    {team.team_name}
                                  </div>
                                  <div className="text-sm px-2 py-1 bg-white/10 text-white rounded">
                                    {team.is_radiant ? 'Radiant' : 'Dire'}
                                  </div>
                                  {team.win && (
                                    <div className="text-sm px-2 py-1 bg-primary/20 text-primary rounded font-medium">
                                      Victory
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-white text-sm">Kills: {team.kills}</div>
                                  <div className="text-primary text-xs">Rating: {team.team_imprint_rating.toFixed(0)}</div>
                                </div>
                              </div>

                              {/* Players */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-white/10">
                                      <th className="text-left text-xs text-white/60 uppercase pb-2 px-2">Hero</th>
                                      <th className="text-left text-xs text-white/60 uppercase pb-2 px-2">Player</th>
                                      <th className="text-center text-xs text-white/60 uppercase pb-2 px-2">K/D/A</th>
                                      <th className="text-center text-xs text-white/60 uppercase pb-2 px-2">Net Worth</th>
                                      <th className="text-center text-xs text-white/60 uppercase pb-2 px-2">Hero DMG</th>
                                      <th className="text-center text-xs text-white/60 uppercase pb-2 px-2">Rating</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {team.players.map((player, playerIndex) => (
                                      <tr key={playerIndex} className="border-b border-white/5">
                                        <td className="py-2 px-2">
                                          <div className="flex items-center gap-2">
                                            <img 
                                              src={player.hero.icon_src} 
                                              alt={player.hero.Name}
                                              className="w-8 h-8 rounded"
                                              loading="lazy"
                                            />
                                            <span className="text-white text-xs">{player.hero.Name}</span>
                                          </div>
                                        </td>
                                        <td className="py-2 px-2">
                                          <div className="text-white text-xs">{player.account_name}</div>
                                          <div className="text-white/40 text-xs">{player.position}</div>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className="text-primary">{player.kills}</span>
                                          <span className="text-white/40">/</span>
                                          <span className="text-red-400">{player.deaths}</span>
                                          <span className="text-white/40">/</span>
                                          <span className="text-white">{player.assists}</span>
                                        </td>
                                        <td className="py-2 px-2 text-center text-white text-xs">
                                          {(player.net_worth / 1000).toFixed(1)}k
                                        </td>
                                        <td className="py-2 px-2 text-center text-white text-xs">
                                          {(player.hero_damage / 1000).toFixed(1)}k
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <span className="text-primary text-xs font-medium">
                                            {player.imprint_rating.toFixed(0)}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })
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

  // Handle individual game click to load details
  const handleGameClick = async (dota2MatchId, gameKey) => {
    if (!dota2MatchId) return;

    const gameId = `${dota2MatchId}-${gameKey}`;

    // If clicking the same game, close it
    if (selectedGameId === gameId) {
      setSelectedGameId(null);
      setMatchDetails(null);
      return;
    }

    setSelectedGameId(gameId);
    setLoadingMatch(true);
    setMatchDetails(null);

    try {
      const details = await fetchMatchDetails(dota2MatchId);
      setMatchDetails(details);
    } catch (error) {
      console.error('Error fetching match details:', error);
      setMatchDetails({ error: 'Failed to load match details' });
    } finally {
      setLoadingMatch(false);
    }
  };

  // Image handling functions for team logo updates
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setNewTeamImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeNewImage = () => {
    setNewTeamImage(null);
    setImagePreview(null);
  };

  // Note: Team logo updates are now manual - admin needs to update the image in public/img/teams/
  const handleUpdateTeamImage = async () => {
    if (!myTeam || !newTeamImage || !supabaseToken) return;

    // Check if user is captain (first player)
    const isTeamCaptain = myTeam.players && myTeam.players[0]?.auth_id === user?.sub;
    if (!isTeamCaptain) {
      alert('Only the team captain can update the logo');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Generate the local image path
      const fileExt = newTeamImage.name.split('.').pop();
      const sanitizedName = myTeam.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const localImagePath = `/img/teams/${sanitizedName}.${fileExt}`;

      const authenticatedClient = getSupabaseClient(supabaseToken);
      const { error: updateError } = await authenticatedClient
        .from("teams_s6")
        .update({ 
          image_url: localImagePath,
          pending_image: true // Flag for admin to update
        })
        .eq("id", myTeam.id);

      if (updateError) throw updateError;

      // Log for admin
      console.log('Team logo update requested. Admin needs to save image as:', localImagePath);
      console.log('Image file:', newTeamImage);

      // Refresh the team data
      mutateMyTeam();
      setNewTeamImage(null);
      setImagePreview(null);
      alert('Team logo update requested! An admin will update the logo shortly.');
    } catch (err) {
      console.error("Error updating team image:", err);
      alert('Failed to update team logo. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Render team rosters - 3 per row, compact vertical layout
  const renderRosters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedTeams.length === 0 ? (
        <div className="col-span-full text-center text-white/60 py-8">No teams registered</div>
      ) : (
        sortedTeams.map((team) => {
          const players = parsePlayerData(team.players || []);
          const teamImagePath = getTeamImagePath(team);
          
          return (
            <div key={team.id} className="bg-zinc-800 rounded-lg border border-white/10 overflow-hidden">
              {/* Team Header */}
              <div className="bg-zinc-900 p-4 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  {/* Team Logo */}
                  {teamImagePath ? (
                    <img 
                      src={teamImagePath} 
                      alt={`${team.name} logo`}
                      className="w-12 h-12 object-cover rounded-lg border-2 border-primary/30"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg text-white font-bold">
                        {getTeamInitial(team.name)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{team.name}</h3>
                    {team.captain_name && (
                      <div className="text-xs text-white/60">
                        Captain: <span className="text-primary">{team.captain_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Players Table */}
              {players.length === 0 ? (
                <div className="text-white/60 text-sm text-center py-6">No players yet</div>
              ) : (
                <div className="p-3">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs text-white/60 uppercase pb-2 px-2 w-[140px]">Player</th>
                        <th className="text-center text-xs text-white/60 uppercase pb-2 px-2 w-[80px]">Rank</th>
                        <th className="text-center text-xs text-white/60 uppercase pb-2 px-2 w-[100px]">Dotabuff</th>
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
                                className="text-primary hover:text-primary/80 transition-colors text-xs flex items-center gap-1 overflow-hidden"
                                title={player.name}
                              >
                                <span className="truncate break-all">{player.name}</span>
                                <span className="material-symbols-outlined text-xs flex-shrink-0">open_in_new</span>
                              </a>
                            ) : (
                              <div className="text-white text-xs truncate break-all" title={player.name}>{player.name}</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded inline-block">
                              {player.rank || 'N/A'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            {player.dotabuffProfile && player.dotabuffProfile !== 'https://www.dotabuff.com/players/' ? (
                              <a
                                href={player.dotabuffProfile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                                title="Dotabuff Profile"
                              >
                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                Dotabuff
                              </a>
                            ) : (
                              <span className="text-white/40 text-xs">-</span>
                            )}
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
              onClick={() => navigateToSeason(season.id)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedSeason === season.id
                  ? 'bg-primary text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {season.name}
            </button>
          ))}
        </div>

        {/* Division Selector - Show for all seasons when not viewing Season 6 forms */}
        {!(selectedSeason === 6 && season6Form) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {divisions.map((division) => (
              <button
                key={division.id}
                onClick={() => navigateToDivision(division.id)}
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

      {/* Season 6 Registration/Team Management - Show when form route is active */}
      {selectedSeason === 6 && season6Form && (
        <section className="py-4 mb-8">
          <div>
            {/* Back button */}
            <button
              onClick={() => navigate('/league/s6/d1/standings')}
              className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Season 6 League
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
                      onClick={() => navigate('/league/s6/d1/standings')}
                      className="px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
                    >
                      Back to League
                    </button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-white">My Team</h2>
                    
                    {/* Team Info */}
                    <div className="bg-zinc-900 rounded-lg p-6 mb-6 border border-primary/30">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-xl">{myTeam.name}</h3>
                          {/* Image upload button for captain */}
                          {user && myTeam.players && myTeam.players[0]?.auth_id === user.sub && (
                            <button
                              onClick={() => document.getElementById('team-image-upload-myteam')?.click()}
                              className="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              <span className="material-symbols-outlined text-base">photo_camera</span>
                              Change Team Logo
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {myTeam.image_url ? (
                            <img 
                              src={myTeam.image_url} 
                              alt={myTeam.name} 
                              className="w-20 h-20 object-cover rounded-lg border-2 border-primary/30"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 bg-zinc-800 rounded-lg border-2 border-primary/30 flex items-center justify-center">
                              <span className="text-2xl text-white font-bold">
                                {myTeam.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hidden file input for image upload */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="team-image-upload-myteam"
                      />

                      {/* Image preview and update section */}
                      {imagePreview && (
                        <div className="mb-4 p-4 bg-zinc-800 rounded-lg border border-primary/30">
                          <div className="flex items-center gap-4">
                            <img
                              src={imagePreview}
                              alt="New team logo preview"
                              className="w-12 h-12 object-cover rounded-lg border border-primary/30"
                              loading="lazy"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-white">New team logo preview</p>
                              <p className="text-xs text-white/60">Click update to save changes</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpdateTeamImage}
                                disabled={isUploadingImage}
                                className="px-3 py-1 bg-primary text-black rounded text-sm hover:bg-primary/80 transition-colors disabled:opacity-50"
                              >
                                {isUploadingImage ? "Updating..." : "Update"}
                              </button>
                              <button
                                onClick={removeNewImage}
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

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
        </section>
      )}

      {/* View Selector */}
      <section className="py-4">
          <div className="bg-zinc-900 rounded-lg shadow-md p-6 border border-white/10">
            <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
              <div className="flex gap-2">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => navigateToView(view.id)}
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
    </main>
  );
};

export default League;
