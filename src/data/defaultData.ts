import type { AppData, ClubName } from "../types/app";

export const clubOptions: ClubName[] = [
  "Driver",
  "3W",
  "5W",
  "3H",
  "4H",
  "5H",
  "4I",
  "5I",
  "6I",
  "7I",
  "8I",
  "9I",
  "PW",
  "50W",
  "52W",
  "54W",
  "56W",
  "58W",
  "60W",
  "GW",
  "SW",
  "LW",
];

export const initialAppData: AppData = {
  rounds: [],
  clubShots: [],
  bettingGames: [],
  leagueRounds: [],
  trainingSessions: [],
  leagueSettings: {
    players: ["You", "Friend 1", "Friend 2", "Friend 3"],
    winnerPoints: 5,
    participationPoints: 1,
  },
};
