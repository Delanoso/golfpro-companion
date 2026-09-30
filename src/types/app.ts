export type HoleCount = 9 | 18;
export type DistanceUnit = "meters" | "yards";
export type AppSection = "golf-strategy";

export type WedgeShot = {
  id: string;
  hole?: number;
  distanceYards: number;
  miss: "left" | "right" | "over" | "short" | "on-green";
};

export type HoleScore = {
  holeNumber: number;
  par: number;
  strokes: number;
  putts: number;
  gir?: boolean;
  wedgeDistanceYards?: number;
  wedgeMiss?: WedgeShot["miss"];
  wedgeShots?: Array<{
    distanceYards: number;
    miss: WedgeShot["miss"];
  }>;
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
  holeScores: HoleScore[];
  wedgeShots: WedgeShot[];
  notes?: string;
};

export type ClubName =
  | "Driver"
  | "2W"
  | "3W"
  | "4W"
  | "5W"
  | "7W"
  | "9W"
  | "11W"
  | "13W"
  | "1H"
  | "2H"
  | "3H"
  | "4H"
  | "5H"
  | "6H"
  | "7H"
  | "1I"
  | "2I"
  | "3I"
  | "4I"
  | "5I"
  | "6I"
  | "7I"
  | "8I"
  | "9I"
  | "PW"
  | "46W"
  | "48W"
  | "50W"
  | "52W"
  | "54W"
  | "56W"
  | "58W"
  | "60W"
  | "62W"
  | "GW"
  | "AW"
  | "SW"
  | "LW"
  | "Putter";

export type ClubShot = {
  id: string;
  date: string;
  club: ClubName;
  distanceYards: number;
  shotShape: "straight" | "draw" | "fade" | "miss-left" | "miss-right";
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
  clubBag: ClubName[];
  leagueRounds: LeagueRound[];
  leagueSettings: LeagueSettings;
};
