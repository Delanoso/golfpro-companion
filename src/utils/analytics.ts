import type {
  AppData,
  ClubShot,
  LeaguePlayerRound,
  LeagueRound,
  RoundEntry,
  WedgeShot,
} from "../types/app";

type ClubStat = {
  club: string;
  samples: number;
  min: number;
  max: number;
  average: number;
};

type WedgeBucket = {
  label: string;
  min: number;
  max: number;
  samples: number;
  averageProximity: number;
};

type ScoreSummary = {
  roundsPlayed: number;
  averageScore: number;
  averagePar: number;
  averageDiffToPar: number;
};

type PuttingSummary = {
  totalHoles: number;
  totalPutts: number;
  puttsPerHole: number;
  onePuttRate: number;
  threePuttRate: number;
  estimatedPuttingStrokesLost: number;
};

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

export function getScoreSummary(rounds: RoundEntry[]): ScoreSummary {
  return {
    roundsPlayed: rounds.length,
    averageScore: average(rounds.map((round) => round.totalScore)),
    averagePar: average(rounds.map((round) => round.par)),
    averageDiffToPar: average(rounds.map((round) => round.totalScore - round.par)),
  };
}

export function getPuttingSummary(rounds: RoundEntry[]): PuttingSummary {
  const totalHoles = rounds.reduce((sum, round) => sum + round.holes, 0);
  const totalPutts = rounds.reduce((sum, round) => sum + round.putts, 0);
  const totalOnePutts = rounds.reduce((sum, round) => sum + round.onePutts, 0);
  const totalThreePutts = rounds.reduce((sum, round) => sum + round.threePutts, 0);
  const baselinePutts = totalHoles * 1.8;

  return {
    totalHoles,
    totalPutts,
    puttsPerHole: totalHoles === 0 ? 0 : totalPutts / totalHoles,
    onePuttRate: totalHoles === 0 ? 0 : (totalOnePutts / totalHoles) * 100,
    threePuttRate: totalHoles === 0 ? 0 : (totalThreePutts / totalHoles) * 100,
    estimatedPuttingStrokesLost: Math.max(0, totalPutts - baselinePutts),
  };
}

export function getWedgeBuckets(rounds: RoundEntry[]): WedgeBucket[] {
  const wedges = rounds.flatMap((round) => round.wedgeShots);
  const ranges = [
    { label: "30-60 yd", min: 30, max: 60 },
    { label: "61-90 yd", min: 61, max: 90 },
    { label: "91-120 yd", min: 91, max: 120 },
    { label: "121-150 yd", min: 121, max: 150 },
  ];

  return ranges.map((range) => {
    const inRange = wedges.filter(
      (wedge) => wedge.distanceYards >= range.min && wedge.distanceYards <= range.max,
    );
    return {
      ...range,
      samples: inRange.length,
      averageProximity: average(inRange.map((wedge) => wedge.proximityFeet)),
    };
  });
}

export function estimateWedgeStrokesLost(rounds: RoundEntry[]) {
  const wedges: WedgeShot[] = rounds.flatMap((round) => round.wedgeShots);
  if (wedges.length === 0) return 0;

  // Rough heuristic: every 12 ft over 18 ft average proximity costs ~0.5 strokes over sample set.
  const averageProximity = average(wedges.map((shot) => shot.proximityFeet));
  const overTarget = Math.max(0, averageProximity - 18);
  return (overTarget / 12) * 0.5 * (wedges.length / 10);
}

export function getClubDistanceStats(shots: ClubShot[]): ClubStat[] {
  const groups = new Map<string, number[]>();
  shots.forEach((shot) => {
    const existing = groups.get(shot.club) ?? [];
    existing.push(shot.distanceYards);
    groups.set(shot.club, existing);
  });

  return Array.from(groups.entries())
    .map(([club, distances]) => ({
      club,
      samples: distances.length,
      min: Math.min(...distances),
      max: Math.max(...distances),
      average: average(distances),
    }))
    .sort((a, b) => b.average - a.average);
}

export function getBettingNetByPlayer(data: AppData) {
  const totals = new Map<string, number>();
  data.bettingGames.forEach((game) => {
    game.results.forEach((result) => {
      totals.set(result.player, (totals.get(result.player) ?? 0) + result.netAmount);
    });
  });

  return Array.from(totals.entries())
    .map(([player, net]) => ({ player, net }))
    .sort((a, b) => b.net - a.net);
}

type LeaderboardRow = {
  player: string;
  rounds: number;
  averageGross: number;
  averageNet: number;
  points: number;
  currentHandicap: number;
};

const getPlayerRounds = (rounds: LeagueRound[], player: string): LeaguePlayerRound[] =>
  rounds
    .flatMap((round) => round.playerRounds)
    .filter((playerRound) => playerRound.player === player);

export function getCurrentHandicap(rounds: LeagueRound[], player: string): number {
  const recent = getPlayerRounds(rounds, player).slice(-5);
  if (recent.length === 0) return 0;
  return average(recent.map((round) => round.handicap));
}

export function getLeagueLeaderboard(data: AppData): LeaderboardRow[] {
  return data.leagueSettings.players
    .map((player) => {
      const rows = getPlayerRounds(data.leagueRounds, player);
      return {
        player,
        rounds: rows.length,
        averageGross: average(rows.map((row) => row.grossScore)),
        averageNet: average(rows.map((row) => row.netScore)),
        points: rows.reduce((sum, row) => sum + row.pointsAwarded, 0),
        currentHandicap: getCurrentHandicap(data.leagueRounds, player),
      };
    })
    .sort((a, b) => b.points - a.points);
}

export function getBiggestLeak(rounds: RoundEntry[]) {
  const puttingLeak = getPuttingSummary(rounds).estimatedPuttingStrokesLost;
  const wedgeLeak = estimateWedgeStrokesLost(rounds);

  if (puttingLeak === 0 && wedgeLeak === 0) {
    return {
      area: "No clear data yet",
      message: "Add more rounds, putts, and wedge outcomes to identify your biggest stroke leak.",
    };
  }

  if (puttingLeak >= wedgeLeak) {
    return {
      area: "Putting efficiency",
      message: `Estimated ${puttingLeak.toFixed(1)} strokes lost from putting pace and 3-putt control.`,
    };
  }

  return {
    area: "Wedge proximity",
    message: `Estimated ${wedgeLeak.toFixed(1)} strokes lost from wedge leave distances.`,
  };
}
