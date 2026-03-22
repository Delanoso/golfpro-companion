export type HoleCount = 9 | 18;

export type WedgeShot = {
  id: string;
  distanceYards: number;
  proximityFeet: number;
};

export type RoundEntry = {
  id: string;
  date: string;
  course: string;
  holes: HoleCount;
  par: number;
  totalScore: number;
  putts: number;
  onePutts: number;
  threePutts: number;
  wedgeShots: WedgeShot[];
  notes?: string;
};

export type ClubName =
  | "Driver"
  | "3W"
  | "5W"
  | "3H"
  | "4H"
  | "5H"
  | "4I"
  | "5I"
  | "6I"
  | "7I"
  | "8I"
  | "9I"
  | "PW"
  | "GW"
  | "SW"
  | "LW";

export type ClubShot = {
  id: string;
  date: string;
  club: ClubName;
  distanceYards: number;
  shotShape: "straight" | "draw" | "fade" | "miss-left" | "miss-right";
};

export type BettingGameType = "Vegas" | "Banker" | "Hammer";

export type BettingResult = {
  player: string;
  points: number;
  netAmount: number;
};

export type BettingGame = {
  id: string;
  date: string;
  gameType: BettingGameType;
  stakePerPoint: number;
  results: BettingResult[];
  notes?: string;
};

export type LeaguePlayerRound = {
  player: string;
  grossScore: number;
  handicap: number;
  netScore: number;
  pointsAwarded: number;
};

export type LeagueRound = {
  id: string;
  date: string;
  course: string;
  par: number;
  playerRounds: LeaguePlayerRound[];
};

export type LeagueSettings = {
  players: string[];
  winnerPoints: number;
  participationPoints: number;
};

export type AppData = {
  rounds: RoundEntry[];
  clubShots: ClubShot[];
  bettingGames: BettingGame[];
  leagueRounds: LeagueRound[];
  leagueSettings: LeagueSettings;
};
