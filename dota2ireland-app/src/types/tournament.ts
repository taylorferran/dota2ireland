export interface Game {
  played: boolean;
  winner?: string;
  dota2MatchId?: string;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  date: string;
  completed: boolean;
  week: number;
  games: {
    game1: Game;
    game2: Game;
    game3?: Game;
    game4?: Game;
    game5?: Game;
  };
  score?: [number, number];
  isByeWeek?: boolean;
  isKnockout?: boolean;
}

