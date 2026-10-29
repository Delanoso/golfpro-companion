import { clubOptions } from "../data/defaultData";
import type {
  AppData,
  ClubName,
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
  minYards: number;
  maxYards: number;
  samples: number;
  onGreenRate: number;
  missLeftRate: number;
  missRightRate: number;
  missOverRate: number;
  missShortRate: number;
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

type GirSummary = {
  totalHoles: number;
  girHoles: number;
  rate: number;
};

type FirSummary = {
  totalHoles: number;
  firHoles: number;
  rate: number;
};

type TrendMetric = {
  current: number;
  previous: number;
  delta: number;
  hasPrevious: boolean;
};

type PerformanceTrends = {
  scoreVsPar: TrendMetric;
  puttsPerHole: TrendMetric;
  girRate: TrendMetric;
  firRate: TrendMetric;
};

type StrokesGainedLite = {
  offTee: number;
  approach: number;
  putting: number;
  total: number;
};

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const clubOrderLookup = new Map<ClubName, number>(
  clubOptions.map((club, index) => [club, index]),
);

const compareClubOrder = (a: string, b: string): number => {
  const rankA = clubOrderLookup.get(a as ClubName);
  const rankB = clubOrderLookup.get(b as ClubName);
  if (typeof rankA === "number" && typeof rankB === "number") {
    return rankA - rankB;
  }
  if (typeof rankA === "number") return -1;
  if (typeof rankB === "number") return 1;
  return a.localeCompare(b);
};

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

export function getGirSummary(rounds: RoundEntry[]): GirSummary {
  const holeScores = rounds.flatMap((round) => round.holeScores ?? []);
  const tracked = holeScores.filter((hole) => typeof hole.gir === "boolean");
  const girCount = tracked.filter((hole) => hole.gir).length;
  return {
    totalHoles: tracked.length,
    girHoles: girCount,
    rate: tracked.length === 0 ? 0 : (girCount / tracked.length) * 100,
  };
}

export function getFirSummary(rounds: RoundEntry[]): FirSummary {
  const holeScores = rounds.flatMap((round) => round.holeScores ?? []);
  const tracked = holeScores.filter((hole) => typeof hole.fir === "boolean");
  const firCount = tracked.filter((hole) => hole.fir).length;
  return {
    totalHoles: tracked.length,
    firHoles: firCount,
    rate: tracked.length === 0 ? 0 : (firCount / tracked.length) * 100,
  };
}

const trendMetric = (currentValues: number[], previousValues: number[]): TrendMetric => {
  const current = average(currentValues);
  const previous = average(previousValues);
  return {
    current,
    previous,
    delta: current - previous,
    hasPrevious: previousValues.length > 0,
  };
};

export function getPerformanceTrends(rounds: RoundEntry[]): PerformanceTrends {
  const ordered = rounds.slice().sort((a, b) => a.date.localeCompare(b.date));
  const current = ordered.slice(-5);
  const previous = ordered.slice(Math.max(0, ordered.length - 10), Math.max(0, ordered.length - 5));

  const rate = (values: boolean[]) =>
    values.length === 0 ? 0 : (values.filter((value) => value).length / values.length) * 100;

  return {
    scoreVsPar: trendMetric(
      current.map((round) => round.totalScore - round.par),
      previous.map((round) => round.totalScore - round.par),
    ),
    puttsPerHole: trendMetric(
      current.map((round) => round.putts / round.holes),
      previous.map((round) => round.putts / round.holes),
    ),
    girRate: trendMetric(
      [
        rate(
          current.flatMap((round) =>
            round.holeScores.filter((hole) => typeof hole.gir === "boolean").map((hole) => hole.gir as boolean),
          ),
        ),
      ],
      [
        rate(
          previous.flatMap((round) =>
            round.holeScores.filter((hole) => typeof hole.gir === "boolean").map((hole) => hole.gir as boolean),
          ),
        ),
      ],
    ),
    firRate: trendMetric(
      [
        rate(
          current.flatMap((round) =>
            round.holeScores.filter((hole) => typeof hole.fir === "boolean").map((hole) => hole.fir as boolean),
          ),
        ),
      ],
      [
        rate(
          previous.flatMap((round) =>
            round.holeScores.filter((hole) => typeof hole.fir === "boolean").map((hole) => hole.fir as boolean),
          ),
        ),
      ],
    ),
  };
}

export function getStrokesGainedLite(rounds: RoundEntry[]): StrokesGainedLite {
  const putting = getPuttingSummary(rounds);
  const gir = getGirSummary(rounds);
  const fir = getFirSummary(rounds);

  // Lightweight benchmark model for trend direction, not PGA-validated SG.
  const offTee = (fir.rate - 50) / 20;
  const approach = (gir.rate - 35) / 15;
  const puttingScore = putting.totalHoles === 0 ? 0 : (1.9 - putting.puttsPerHole) * 5;

  const total = offTee + approach + puttingScore;
  return {
    offTee,
    approach,
    putting: puttingScore,
    total,
  };
}

export function getWedgeBuckets(rounds: RoundEntry[]): WedgeBucket[] {
  const wedges = rounds.flatMap((round) => round.wedgeShots);
  const ranges = [
    { minYards: 30, maxYards: 60 },
    { minYards: 61, maxYards: 90 },
    { minYards: 91, maxYards: 120 },
    { minYards: 121, maxYards: 150 },
  ];

  return ranges.map((range) => {
    const inRange = wedges.filter(
      (wedge) =>
        wedge.distanceYards >= range.minYards && wedge.distanceYards <= range.maxYards,
    );
    const missCount = (miss: WedgeShot["miss"]) =>
      inRange.filter((wedge) => wedge.miss === miss).length;
    return {
      ...range,
      samples: inRange.length,
      onGreenRate: inRange.length === 0 ? 0 : (missCount("on-green") / inRange.length) * 100,
      missLeftRate: inRange.length === 0 ? 0 : (missCount("left") / inRange.length) * 100,
      missRightRate: inRange.length === 0 ? 0 : (missCount("right") / inRange.length) * 100,
      missOverRate: inRange.length === 0 ? 0 : (missCount("over") / inRange.length) * 100,
      missShortRate: inRange.length === 0 ? 0 : (missCount("short") / inRange.length) * 100,
    };
  });
}

export function estimateWedgeStrokesLost(rounds: RoundEntry[]) {
  const wedges: WedgeShot[] = rounds.flatMap((round) => round.wedgeShots);
  if (wedges.length === 0) return 0;

  // Rough heuristic: directional misses imply a weaker wedge outcome profile.
  const missPenaltyMap: Record<WedgeShot["miss"], number> = {
    "on-green": 0.1,
    short: 0.7,
    over: 0.6,
    left: 0.5,
    right: 0.5,
  };
  const totalPenalty = wedges.reduce((sum, shot) => sum + missPenaltyMap[shot.miss], 0);
  return (totalPenalty / wedges.length) * (wedges.length / 10);
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
    .sort((a, b) => compareClubOrder(a.club, b.club));
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
      message: "Add more rounds, putts, and wedge shot outcomes to identify your biggest stroke leak.",
    };
  }

  if (puttingLeak >= wedgeLeak) {
    return {
      area: "Putting efficiency",
      message: `Estimated ${puttingLeak.toFixed(1)} strokes lost from putting pace and 3-putt control.`,
    };
  }

  return {
    area: "Wedge control",
    message: `Estimated ${wedgeLeak.toFixed(1)} strokes lost from wedge shot patterns.`,
  };
}
