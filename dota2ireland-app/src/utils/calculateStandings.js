/**
 * Calculate team standings from match data
 * @param {Array} matches - Array of match objects
 * @param {Object} teamNames - Map of team IDs to team names
 * @param {number} divisionId - Division number
 * @returns {Array} Array of team standings with points, wins, draws, losses
 */
export const calculateStandings = (matches, teamNames, divisionId) => {
  // Initialize team stats
  const teamStats = {};
  
  // Get all unique team IDs from matches (excluding bye weeks and placeholder teams)
  const allTeams = new Set();
  matches.forEach(match => {
    if (!match.isByeWeek && match.team1Id !== 'bye_week' && match.team2Id !== 'bye_week') {
      // Skip placeholder teams (seeds, winners)
      if (!match.team1Id.startsWith('seed') && !match.team1Id.startsWith('winner')) {
        allTeams.add(match.team1Id);
      }
      if (!match.team2Id.startsWith('seed') && !match.team2Id.startsWith('winner')) {
        allTeams.add(match.team2Id);
      }
    }
  });

  // Initialize stats for all teams
  allTeams.forEach(teamId => {
    teamStats[teamId] = {
      id: teamId,
      team_id: teamId,
      name: teamNames[teamId] || teamId,
      division_id: divisionId,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      matches_played: 0,
    };
  });

  // Process completed matches
  matches.forEach(match => {
    // Only process completed, non-bye, non-knockout matches for group stage standings
    if (match.completed && !match.isByeWeek && !match.isKnockout && match.score) {
      const [team1Score, team2Score] = match.score;
      const team1Id = match.team1Id;
      const team2Id = match.team2Id;

      // Skip if teams don't exist in our stats (placeholder teams)
      if (!teamStats[team1Id] || !teamStats[team2Id]) {
        return;
      }

      teamStats[team1Id].matches_played++;
      teamStats[team2Id].matches_played++;

      if (team1Score > team2Score) {
        // Team 1 wins
        teamStats[team1Id].wins++;
        teamStats[team1Id].points += 3;
        teamStats[team2Id].losses++;
      } else if (team2Score > team1Score) {
        // Team 2 wins
        teamStats[team2Id].wins++;
        teamStats[team2Id].points += 3;
        teamStats[team1Id].losses++;
      } else {
        // Draw
        teamStats[team1Id].draws++;
        teamStats[team1Id].points += 1;
        teamStats[team2Id].draws++;
        teamStats[team2Id].points += 1;
      }
    }
  });

  // Convert to array and sort by points (then wins, then draws)
  return Object.values(teamStats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.draws !== a.draws) return b.draws - a.draws;
    return a.losses - b.losses;
  });
};

/**
 * Calculate standings for all divisions
 * @param {Object} divisionMatches - Object with division numbers as keys and match arrays as values
 * @param {Object} teamNames - Map of team IDs to team names
 * @returns {Object} Object with division numbers as keys and standings arrays as values
 */
export const calculateAllDivisionStandings = (divisionMatches, teamNames) => {
  const allStandings = {};
  
  Object.keys(divisionMatches).forEach(divisionId => {
    const divNum = parseInt(divisionId);
    allStandings[divNum] = calculateStandings(
      divisionMatches[divisionId],
      teamNames,
      divNum
    );
  });
  
  return allStandings;
};

