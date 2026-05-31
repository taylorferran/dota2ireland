import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../components/ToastProvider';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { supabase, getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { divisionMatches as season4Matches } from '../data/matchData';
import { divisionMatches as season5Matches } from '../data/matchDataSeason5';
import { divisionMatches as season6Matches } from '../data/matchDataSeason6';
import { divisionMatches as season7Matches } from '../data/matchDataSeason7';
import { KnockoutBracket } from '../components/KnockoutBracket';
import { AddTeamForm } from '../components/AddTeamForm';
import { JoinTeamForm } from '../components/JoinTeamForm';
import { LFTForm } from '../components/LFTForm';
import { useMyTeam } from '../hooks/useMyTeam';
import { fetchMatchDetails } from '../services/matchApi';
import { getTeamImagePath, getTeamInitial } from '../utils/teamImages';
import { calculateAllDivisionStandings } from '../utils/calculateStandings';
import { season7Schedule } from '../data/matchScheduleSeason7';
import S7MatchCalendar from '../components/S7MatchCalendar';
import S7FullCalendar from '../components/S7FullCalendar';

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
  wongs_bakery: "Wongs Bakery 贖回",
  skiddys_angels: "Skiddy's Angels",
  sentinel_island_esports: "Sentinel Island Esports",
  no_tormentor: "No Tormentor",
  the_pepegs: "The Pepegs",
  // Division 2
  creep_enjoyers: "Creep Enjoyers",
  bdc: "BDC",
  washed_rejected: "Washed & Rejected",
  i_do_revenge: "I DO: REVENGE",
  // Division 3
  joon_squad_junior: "Joon Squad: Joonior",
  imprint_esports: "Imprint Esports",
  green_isle_gaming: "Green Isle Gaming",
  motion_of_the_roshan: "Motion of the Roshan",
  ausgang: "Ausgang",
  d2ire_rejects: "D2Ire Rejects",
  passport_issues: "Passport Issues",
  // Division 4
  five_stuns_no_brain: "5 Stuns No Brains",
  bord_na_mona: "Bord na Mona",
  cavan_creche: "Cavan Crèche ",
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

const season7TeamNames = {
  bye_week: "Bye Week",
  // Division 1
  business_mices: "Business Mices",
  the_mystery_machine: "The Myst-ery Machine",
  full_english_breakfast: "Full English Breakfast",
  wongwongbakery: "WONGWONGBAKERY",
  last_hit_academy: "Last Hit Academy",
  shishuli: "ShiShuli",
  // Division 2 (split into Groups 2A / 2B / 2C by MMR seeding - see division_id in DB)
  joonsquad_next: "JoonSquad: Next Jooneration",
  runners: "RUNNERS",
  imprint_esports: "Imprint Esports",
  the_dark_side: "The Dark Side of the Map",
  fost_team: "Fost team",
  mmr_famine: "MMR Famine",
  secretshop: "SecretShop",
  random: "Random",
  d2ire_rejects: "D2Ire Rejects",
  mikes_army: "Mikes Army",
  five_stuns_no_brains: "5 Stuns No Brains",
  missprint_esports: "Missprint Esports",
  cavan_creche: "Cavan Creche",
  the_chumps_people: "The Chump's People",
  owen_morris_cummers: "Owen Morris and the CUMMERS",
  // Division 3
  grumpy_old_men: "Grumpy Old Men",
  bord_na_mona: "Bord na Mona",
  veleno: "VELENO",
  wreck_the_herald: "Wreck the Herald",
  team_sosal: "Team Sosal",
};

const League = () => {
  const { season: seasonParam, divisionOrView, view: viewParam } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const { supabaseToken } = useAuth();
  const { team: myTeam, loading: myTeamLoading, mutate: mutateMyTeam } = useMyTeam();
  
  // Parse URL params to derive state
  const selectedSeason = useMemo(() => {
    if (!seasonParam) return 7;
    const match = seasonParam.match(/^s(\d+)$/);
    return match ? parseInt(match[1]) : 7;
  }, [seasonParam]);

  // For seasons 6 & 7, check if divisionOrView is a form/view route or a division
  const currentSeasonForm = useMemo(() => {
    if (selectedSeason !== 7) return null;
    if (!divisionOrView) return null;
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

  const selectedDivision = useMemo(() => {
    if (selectedSeason === 7 && currentSeasonForm) return 1;
    if (!divisionOrView) return 1;
    if (selectedSeason === 7) {
      const s7Map = { d1: 1, d2a: 2, d2b: 22, d2c: 23, d3: 3 };
      if (s7Map[divisionOrView] !== undefined) return s7Map[divisionOrView];
    }
    const match = divisionOrView.match(/^d(\d+)$/);
    return match ? parseInt(match[1]) : 1;
  }, [divisionOrView, selectedSeason, currentSeasonForm]);

  const selectedView = useMemo(() => {
    if (selectedSeason === 7 && currentSeasonForm) return 'standings';
    if (!viewParam) return 'standings';
    const viewMap = { standings: 'standings', matches: 'matches', teams: 'rosters', calendar: 'calendar' };
    return viewMap[viewParam] || 'standings';
  }, [viewParam, selectedSeason, currentSeasonForm]);

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [standingsView, setStandingsView] = useState('group'); // 'group' or 'knockout'
  const [teams, setTeams] = useState([]);
  const [availabilitySet, setAvailabilitySet] = useState(new Set()); // auth_ids who submitted
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

  const divisionUrlParam = (divId) => {
    if (selectedSeason === 7) {
      const map = { 1: 'd1', 2: 'd2a', 22: 'd2b', 23: 'd2c', 3: 'd3' };
      return map[divId] ?? `d${divId}`;
    }
    return `d${divId}`;
  };

  const navigateToDivision = (divisionId) => {
    const view = selectedView === 'calendar' ? 'standings' : (viewParam || 'standings');
    navigate(`/league/s${selectedSeason}/${divisionUrlParam(divisionId)}/${view}`);
  };

  const navigateToView = (viewId) => {
    const viewMap = { standings: 'standings', matches: 'matches', rosters: 'teams', calendar: 'calendar' };
    navigate(`/league/s${selectedSeason}/${divisionUrlParam(selectedDivision)}/${viewMap[viewId]}`);
  };



  // Get match data based on selected season
  const matchData = selectedSeason === 4 ? season4Matches : selectedSeason === 5 ? season5Matches : selectedSeason === 6 ? season6Matches : season7Matches;
  const teamNamesMap = selectedSeason === 4 ? season4TeamNames : selectedSeason === 5 ? season5TeamNames : selectedSeason === 6 ? season6TeamNames : season7TeamNames;
  const divisionMatchData = matchData[selectedDivision] || [];

  // For S7 calendar: reverse-lookup user's team key from their team name
  const myTeamKey = useMemo(() => {
    if (selectedSeason !== 7 || !myTeam) return null;
    return Object.entries(season7TeamNames).find(([, v]) => v === myTeam.name)?.[0] ?? null;
  }, [selectedSeason, myTeam]);
  
  // Get max week for matches (exclude knockout weeks for seasons 6 & 7)
  const groupStageMatchData = (selectedSeason === 6 || selectedSeason === 7)
    ? divisionMatchData.filter(m => !m.isKnockout)
    : divisionMatchData;
  const maxWeek = groupStageMatchData.length > 0
    ? Math.max(...groupStageMatchData.map(m => m.week))
    : 1;

  const seasons = [
    { id: 4, name: 'Season 4', active: true },
    { id: 5, name: 'Season 5', active: true },
    { id: 6, name: 'Season 6', active: true },
    { id: 7, name: 'Season 7', active: true },
  ];

  const divisions = selectedSeason === 7
    ? [
        { id: 1, name: 'Division 1' },
        { id: 2, name: 'Division 2A' },
        { id: 22, name: 'Division 2B' },
        { id: 23, name: 'Division 2C' },
        { id: 3, name: 'Division 3' },
      ]
    : selectedSeason === 4 || selectedSeason === 5
    ? [
        { id: 1, name: 'Division 1' },
        { id: 2, name: 'Division 2' },
        { id: 3, name: 'Division 3' },
      ]
    : [
        { id: 1, name: 'Division 1' },
        { id: 2, name: 'Division 2' },
        { id: 3, name: 'Division 3' },
        { id: 4, name: 'Division 4' },
      ];

  const views = selectedSeason === 7
    ? [
        { id: 'standings', name: 'Standings' },
        { id: 'matches', name: 'Schedule' },
        { id: 'rosters', name: 'Team Rosters' },
      ]
    : [
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
      // For Season 6 & 7, fetch roster data from database AND calculate standings from match data
      if (selectedSeason === 6 || selectedSeason === 7) {
        const seasonTable = selectedSeason === 7 ? 'teams_s7' : 'teams_s6';
        const seasonMatches = selectedSeason === 7 ? season7Matches : season6Matches;
        const seasonTeamNames = selectedSeason === 7 ? season7TeamNames : season6TeamNames;
        // STEP 1: Fetch roster data from database (for players, captain names, etc.)
        const { data: teamsData, error: teamsError } = await supabase
          .from(seasonTable)
          .select('*')
          .order('division_id', { ascending: true });

        if (teamsError) {
          console.error('Error fetching teams:', teamsError);
          setTeams([]);
        } else {
          // Parse the players field
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

          // STEP 2: Calculate standings from match data
          const calculatedStandings = calculateAllDivisionStandings(seasonMatches, seasonTeamNames);

          // STEP 3: Merge - keep ALL database data but override ONLY standings fields
          const mergedTeams = parsedTeams.map((dbTeam) => {
            // Find the calculated standings for this team
            const divisionStandings = calculatedStandings[dbTeam.division_id] || [];
            
            // Try to match by team name since team_id might not exist in database
            const calculatedTeam = divisionStandings.find(t => t.name === dbTeam.name);

            if (calculatedTeam) {
              // Keep everything from database, but override standings with calculated values
              return {
                ...dbTeam, // Keep all database fields (players, captain_name, etc.)
                wins: calculatedTeam.wins,
                draws: calculatedTeam.draws,
                losses: calculatedTeam.losses,
                points: calculatedTeam.points,
                matches_played: calculatedTeam.matches_played,
              };
            }
            
            // If no calculated standings found (shouldn't happen), keep database values
            console.warn(`No calculated standings found for team "${dbTeam.name}" in division ${dbTeam.division_id}`);
            return dbTeam;
          });

          setTeams(mergedTeams);

          // For s7, fetch who has submitted availability
          if (selectedSeason === 7) {
            const { data: availData } = await supabase
              .from('s7_availability')
              .select('auth_id');
            if (availData) {
              setAvailabilitySet(new Set(availData.map(r => r.auth_id)));
            }
          }
        }
      } else {
        // For other seasons, fetch from database
        const teamsTable = selectedSeason === 4 ? 'teams_duplicate' : 'teams';
        
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
      }

      // Matches are loaded from static data files (matchDataSeason4.js / matchDataSeason5.js / matchDataSeason6.ts / matchDataSeason7.ts)
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
    // Season 6 uses Challonge embeds
    const challongeEmbeds = {
      1: { src: 'https://challonge.com/8tgxwozl/module', title: 'Division 1 Playoff Bracket' },
      2: { src: 'https://challonge.com/wcr2g2rr/module', title: 'Division 2 Playoff Bracket' },
      3: { src: 'https://challonge.com/i29sl3qz/module', title: 'Division 3 Playoff Bracket' },
      4: { src: 'https://challonge.com/u5s96bzm/module', title: 'Division 4 Playoff Bracket' },
    };
    const embed = (selectedSeason === 6) && challongeEmbeds[selectedDivision];
    if (embed) {
      return (
        <div className="pb-8">
          <iframe
            src={embed.src}
            width="100%"
            height="500"
            frameBorder="0"
            scrolling="auto"
            allowTransparency="true"
            title={embed.title}
          />
        </div>
      );
    }

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
    const weekMatches = divisionMatchData.filter(m => m.week === selectedWeek && !m.isByeWeek && !((selectedSeason === 6 || selectedSeason === 7) && m.isKnockout));
    
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
                          {matchDetails.teams
                            .sort((a, b) => b.is_radiant - a.is_radiant) // Radiant first (true=1, false=0)
                            .map((team, teamIndex) => (
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
                                              alt={player.hero.name}
                                              className="w-8 h-8 rounded"
                                              loading="lazy"
                                            />
                                            <span className="text-white text-xs">{player.hero.name}</span>
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
        toast.error('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setNewTeamImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const removeNewImage = () => {
    setNewTeamImage(null);
    setImagePreview(null);
  };

  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 192;
          const scale = Math.min(MAX / img.width, MAX / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const handleUpdateTeamImage = async () => {
    if (!myTeam || !newTeamImage || !supabaseToken) return;

    const isTeamCaptain = myTeam.players && myTeam.players[0]?.auth_id === user?.sub;
    if (!isTeamCaptain) {
      toast.error('Only the team captain can update the logo');
      return;
    }

    setIsUploadingImage(true);

    try {
      const imageDataUrl = await compressImage(newTeamImage);

      const authenticatedClient = getSupabaseClient(supabaseToken);
      const activeTable = selectedSeason === 6 ? "teams_s6" : "teams_s7";
      const { error: updateError } = await authenticatedClient
        .from(activeTable)
        .update({ image_url: imageDataUrl, pending_image: false })
        .eq("id", myTeam.id);

      if (updateError) throw updateError;

      mutateMyTeam();
      setNewTeamImage(null);
      setImagePreview(null);
      toast.success('Team logo updated!');
    } catch (err) {
      console.error("Error updating team image:", err);
      toast.error('Failed to update team logo. Please try again.');
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
          const avgMmr = players.length
            ? Math.round(players.reduce((sum, p) => sum + (Number(p?.rank) || 0), 0) / 5)
            : null;

          return (
            <div key={team.id} className="bg-zinc-800 rounded-lg border border-white/10 overflow-visible">
              {/* Team Header */}
              <div className="bg-zinc-900 p-4 border-b border-white/10 relative">
                <div className="flex items-center gap-3 mb-2">
                  {/* Team Logo */}
                  {teamImagePath ? (
                    <img
                      src={teamImagePath}
                      alt={`${team.name} logo`}
                      className="w-12 h-12 object-contain rounded-lg border-2 border-primary/30 opacity-100 transition-transform duration-200 [transition:transform_200ms,opacity_700ms,border_0ms_200ms,border-radius_0ms_200ms] hover:[transition:transform_200ms,opacity_700ms,border_0ms,border-radius_0ms] hover:scale-[6] hover:rounded-none hover:border-0 hover:z-[9999] hover:shadow-2xl hover:opacity-100 cursor-pointer relative"
                      style={{ willChange: 'transform, opacity' }}
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
                  {selectedSeason === 7 && avgMmr !== null && (
                    <div className="text-right shrink-0">
                      <div className="text-xs text-white/50">Avg MMR</div>
                      <div className="text-sm font-bold text-primary">{avgMmr.toLocaleString()}</div>
                    </div>
                  )}
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
                        <th className="text-center text-xs text-white/60 uppercase pb-2 px-2 w-[80px]">MMR</th>
                        {selectedSeason === 7 && (
                          <th className="text-center text-xs text-white/60 uppercase pb-2 px-2 w-[40px]" title="Availability submitted">Avail</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {[...players].sort((a, b) => {
                        const order = { carry: 1, mid: 2, offlane: 3, support: 4, 'hard support': 5 };
                        return (order[a?.position?.toLowerCase()] ?? 9) - (order[b?.position?.toLowerCase()] ?? 9);
                      }).map((player, index) => {
                        const hasAvailability = selectedSeason === 7 && player.auth_id && availabilitySet.has(player.auth_id);
                        return (
                        <tr key={index} className="border-b border-white/5 last:border-0">
                          <td className="py-2 px-2">
                            {player.dotabuffProfile && player.dotabuffProfile !== 'https://www.dotabuff.com/players/' ? (
                              <a
                                href={player.dotabuffProfile}
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
                          {selectedSeason === 7 && (
                            <td className="py-2 px-2 text-center text-base" title={hasAvailability ? 'Availability submitted' : 'Not submitted'}>
                              {hasAvailability ? '✅' : '❌'}
                            </td>
                          )}
                        </tr>
                        );
                      })}
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


  return (
    <main className="flex-1">
      {/* Hero Section with Auth */}
      <section className="py-2 md:py-3">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-white text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em]">
              IRISH DOTA LEAGUE
            </h1>
            <p className="text-white/60 text-lg mt-2">
              Compete with the best Irish Dota 2 teams
              <Link
                to="/league/rules"
                className="ml-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
              >
                Rules
              </Link>
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
                onClick={() => loginWithRedirect({ appState: { returnTo: window.location.pathname } })}
                className="px-6 py-2 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Season Selector */}
      <section className="py-1">
        <div className="flex flex-wrap items-center gap-2 mb-6">
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
          {selectedSeason === 7 && (
            <button
              onClick={() => navigateToView('calendar')}
              className={`ml-auto px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                selectedView === 'calendar'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-white/5 text-white/60 border border-white/15 hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              Full Schedule
            </button>
          )}
        </div>

        {/* Division Selector - hidden when a form or full calendar is active */}
        {!currentSeasonForm && selectedView !== 'calendar' && (
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


      {/* Season 7 Registration/Team Management - Show when form route is active */}
      {selectedSeason === 7 && currentSeasonForm && (
        <section className="py-4 mb-8">
          <div>
            {/* Back button */}
            <button
              onClick={() => navigate('/league/s7/d1/standings')}
              className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Season 7 League
            </button>

            {/* Render appropriate form or view */}
            {currentSeasonForm === 'register' && (
              isAuthenticated ? <AddTeamForm divisionId={selectedDivision} /> : (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10 text-center space-y-4">
                    <span className="material-symbols-outlined text-5xl text-white/40">lock</span>
                    <h2 className="text-2xl font-bold text-white">Login Required</h2>
                    <p className="text-white/60">You need to be logged in to register a team.</p>
                    <button
                      onClick={() => loginWithRedirect({ appState: { returnTo: window.location.pathname } })}
                      className="px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-primary/80 transition-colors"
                    >
                      Log In
                    </button>
                  </div>
                </div>
              )
            )}
            {currentSeasonForm === 'join' && (
              isAuthenticated ? <JoinTeamForm /> : (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10 text-center space-y-4">
                    <span className="material-symbols-outlined text-5xl text-white/40">lock</span>
                    <h2 className="text-2xl font-bold text-white">Login Required</h2>
                    <p className="text-white/60">You need to be logged in to join a team.</p>
                    <button
                      onClick={() => loginWithRedirect({ appState: { returnTo: window.location.pathname } })}
                      className="px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-primary/80 transition-colors"
                    >
                      Log In
                    </button>
                  </div>
                </div>
              )
            )}
            {currentSeasonForm === 'lft' && (
              <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-4 text-white">Looking for Team - Season 7</h2>
                <p className="text-white/60 mb-6">
                  Fill in the Google Form below to add yourself to the Season 7 LFT list. Captains looking for players can view the sheet.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdxm9QzeiYiNVzWQI03wF3rt8IPvNtBZLhAt-Md8oZp9khyvw/viewform?usp=sharing&ouid=108530844905570802795"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
                  >
                    <span className="material-symbols-outlined">edit</span>
                    Submit LFT Form
                  </a>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1zSwNDXZ5qyImw0965AsHLtvaVSStuTE_YE9KCcfECqs/edit?resourcekey=&gid=1410751443#gid=1410751443"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all"
                  >
                    <span className="material-symbols-outlined">table_view</span>
                    View LFT Sheet
                  </a>
                </div>
              </div>
            )}
            {currentSeasonForm === 'viewlft' && (
              <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-4 text-white">Looking for Team - Season 7</h2>
                <p className="text-white/60 mb-6">
                  Players looking for a team for Season 7 are listed in the sheet below.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://docs.google.com/spreadsheets/d/1zSwNDXZ5qyImw0965AsHLtvaVSStuTE_YE9KCcfECqs/edit?resourcekey=&gid=1410751443#gid=1410751443"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-full font-bold hover:bg-opacity-90 transition-all"
                  >
                    <span className="material-symbols-outlined">table_view</span>
                    View LFT Sheet
                  </a>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdxm9QzeiYiNVzWQI03wF3rt8IPvNtBZLhAt-Md8oZp9khyvw/viewform?usp=sharing&ouid=108530844905570802795"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all"
                  >
                    <span className="material-symbols-outlined">edit</span>
                    Submit LFT Form
                  </a>
                </div>
              </div>
            )}
            {currentSeasonForm === 'viewteams' && (
              <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-6 text-white">Season 7 Teams</h2>
                {renderRosters()}
              </div>
            )}
            {currentSeasonForm === 'viewmyteam' && (
              <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
                {myTeamLoading ? (
                  <div className="text-center text-white/60 py-8">Loading...</div>
                ) : !myTeam ? (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-4 text-white">You're Not on a Team Yet</h2>
                    <p className="text-white/60 mb-6">
                      Register a new team or join an existing one to participate in Season 7.
                    </p>
                    <button
                      onClick={() => navigate('/league/s7/d1/standings')}
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
                                toast.success('Team ID copied to clipboard!');
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
      {!currentSeasonForm && <section className="pt-4 pb-4">
          <div className="bg-zinc-900 rounded-lg shadow-md p-6 border border-white/10">
            {selectedView !== 'calendar' && <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
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

              <div className="flex gap-2 items-center">
                {/* Dotabuff Link - All seasons */}
                {selectedSeason === 6 && (
                  <a
                    href="https://www.dotabuff.com/esports/leagues/19084-irish-dota-league-season-6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Dotabuff
                  </a>
                )}
                {selectedSeason === 5 && (
                  <a
                    href="https://www.dotabuff.com/esports/leagues/18171-irish-dota-league-season-5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Dotabuff
                  </a>
                )}
                {selectedSeason === 4 && (
                  <a
                    href="https://www.dotabuff.com/esports/leagues/17600-irish-dota-league-season-4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Dotabuff
                  </a>
                )}

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
            </div>}

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

            {selectedView === 'matches' && selectedSeason === 7 && (
              <S7MatchCalendar
                matches={season7Schedule.filter(m => m.division === selectedDivision)}
                teamNamesMap={season7TeamNames}
                myTeamId={myTeamKey}
                showDivisionBadge={false}
              />
            )}
            {selectedView === 'matches' && selectedSeason !== 7 && renderMatches()}
            {selectedView === 'calendar' && selectedSeason === 7 && (
              <S7FullCalendar
                matches={season7Schedule}
                teamNamesMap={season7TeamNames}
                myTeamId={myTeamKey}
              />
            )}
            {selectedView === 'rosters' && (
              <>
                {selectedSeason === 7 && (
                  <div className="mb-4 flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="text-sm text-white/80">
                      <span className="text-primary font-medium">✅/❌</span> shows whether each player has submitted their availability
                    </div>
                    {isAuthenticated && myTeam && (
                      <button
                        onClick={() => navigate('/league/s7/availability')}
                        className="relative px-4 py-1.5 bg-primary text-black text-sm font-bold rounded-full hover:bg-primary/80 transition-colors flex items-center gap-1.5"
                      >
                        {!availabilitySet.has(user?.sub) && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[11px] text-white font-black leading-none">!</span>
                        )}
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        Submit Availability
                      </button>
                    )}
                  </div>
                )}
                {renderRosters()}
              </>
            )}
          </div>
        </section>}
    </main>
  );
};

export default League;
