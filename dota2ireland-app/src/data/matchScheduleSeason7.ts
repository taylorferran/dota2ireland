// Season 7 match schedule — populated after availability submissions close

export interface S7Match {
  id: string;
  division: 1 | 2 | 22 | 3;
  week: number;
  team1Id: string;
  team2Id: string;
  date: string;      // YYYY-MM-DD (Europe/Dublin)
  time: string;      // HH:MM (Europe/Dublin)
  completed: boolean;
  score?: [number, number];
  games?: {
    game: number;
    winner: string;
    dota2MatchId?: string;
  }[];
}

export const season7Schedule: S7Match[] = [];
