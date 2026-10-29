import { useMemo, useState } from "react";
import type { BettingGameType, BettingSettlement, HoleCount } from "../../types/app";
import { createId, todayIsoDate } from "../../utils/helpers";

type BettingGame = {
  id: string;
  type: BettingGameType;
  date: string;
  title: string;
  players: string[];
  holes: HoleCount;
  stakePerPoint: number;
  summary: string;
  details?: string;
  settlements?: BettingSettlement[];
};

type BettingGamesManagerProps = {
  games: BettingGame[];
  onAddGame: (game: BettingGame) => void;
  onDeleteGame: (id: string) => void;
};

const createHoleValues = (
  holes: HoleCount,
  players: string[],
  defaultValue: number,
): Record<string, number[]> => {
  const next: Record<string, number[]> = {};
  players.forEach((player) => {
    next[player] = Array.from({ length: holes }, () => defaultValue);
  });
  return next;
};

const settleBalances = (balances: Record<string, number>): BettingSettlement[] => {
  const winners = Object.entries(balances)
    .filter(([_player, amount]) => amount > 0.01)
    .map(([player, amount]) => ({ player, amount }));
  const losers = Object.entries(balances)
    .filter(([_player, amount]) => amount < -0.01)
    .map(([player, amount]) => ({ player, amount: Math.abs(amount) }));

  const settlements: BettingSettlement[] = [];
  let winnerIndex = 0;
  let loserIndex = 0;

  while (winnerIndex < winners.length && loserIndex < losers.length) {
    const winner = winners[winnerIndex];
    const loser = losers[loserIndex];
    const transfer = Math.min(winner.amount, loser.amount);
    settlements.push({
      from: loser.player,
      to: winner.player,
      amount: Number(transfer.toFixed(2)),
    });
    winner.amount -= transfer;
    loser.amount -= transfer;
    if (winner.amount <= 0.01) winnerIndex += 1;
    if (loser.amount <= 0.01) loserIndex += 1;
  }

  return settlements;
};

const balancesFromPoints = (points: Record<string, number>, stakePerPoint: number) => {
  const pointValues = Object.values(points);
  const averagePoints = pointValues.length === 0 ? 0 : pointValues.reduce((sum, value) => sum + value, 0) / pointValues.length;
  const balances: Record<string, number> = {};
  Object.entries(points).forEach(([player, value]) => {
    balances[player] = Number(((value - averagePoints) * stakePerPoint).toFixed(2));
  });
  return balances;
};

export function BettingGamesManager({ games, onAddGame, onDeleteGame }: BettingGamesManagerProps) {
  const [date, setDate] = useState(todayIsoDate());
  const [gameType, setGameType] = useState<BettingGameType>("skins");
  const [playerNamesInput, setPlayerNamesInput] = useState("You, Friend 1, Friend 2, Friend 3");
  const [holes, setHoles] = useState<HoleCount>(18);
  const [stakePerPoint, setStakePerPoint] = useState(20);
  const [pars, setPars] = useState<number[]>(Array.from({ length: 18 }, () => 4));
  const [scores, setScores] = useState<Record<string, number[]>>(
    createHoleValues(18, ["You", "Friend 1", "Friend 2", "Friend 3"], 4),
  );
  const [putts, setPutts] = useState<Record<string, number[]>>(
    createHoleValues(18, ["You", "Friend 1", "Friend 2", "Friend 3"], 2),
  );

  const players = useMemo(
    () =>
      playerNamesInput
        .split(",")
        .map((name) => name.trim())
        .filter((name, index, list) => name.length > 0 && list.indexOf(name) === index),
    [playerNamesInput],
  );

  const ensureScoreShape = () => {
    setPars((current) => Array.from({ length: holes }, (_value, index) => current[index] ?? 4));

    setScores((current) => {
      const next = { ...current };
      players.forEach((player) => {
        const row = next[player] ?? [];
        next[player] = Array.from({ length: holes }, (_value, index) => row[index] ?? 4);
      });
      Object.keys(next).forEach((player) => {
        if (!players.includes(player)) {
          delete next[player];
        }
      });
      return next;
    });

    setPutts((current) => {
      const next = { ...current };
      players.forEach((player) => {
        const row = next[player] ?? [];
        next[player] = Array.from({ length: holes }, (_value, index) => row[index] ?? 2);
      });
      Object.keys(next).forEach((player) => {
        if (!players.includes(player)) {
          delete next[player];
        }
      });
      return next;
    });
  };

  const updateScore = (player: string, holeIndex: number, value: number) => {
    setScores((current) => ({
      ...current,
      [player]: current[player].map((score, index) => (index === holeIndex ? value : score)),
    }));
  };

  const updatePutts = (player: string, holeIndex: number, value: number) => {
    setPutts((current) => ({
      ...current,
      [player]: current[player].map((score, index) => (index === holeIndex ? value : score)),
    }));
  };

  const updatePar = (holeIndex: number, value: number) => {
    setPars((current) => current.map((item, index) => (index === holeIndex ? value : item)));
  };

  const shareGame = async (game: BettingGame) => {
    const settlementText =
      game.settlements && game.settlements.length > 0
        ? game.settlements.map((item) => `${item.from} pays ${item.to} ${item.amount.toFixed(2)}`).join(" · ")
        : "No settlement";
    const text = `${game.title}\n${game.summary}\n${game.details ?? ""}\n${settlementText}`.trim();

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 48px Inter, sans-serif";
    ctx.fillText("GolfPro Betting Result", 48, 90);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 40px Inter, sans-serif";
    ctx.fillText(game.title, 48, 170);
    ctx.font = "28px Inter, sans-serif";
    const lines = [game.summary, game.details ?? "", settlementText].filter((line) => line.length > 0);
    lines.forEach((line, index) => {
      ctx.fillText(line.slice(0, 85), 48, 250 + index * 56);
    });

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], `${game.title.replace(/\s+/g, "-").toLowerCase()}.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: game.title,
        text,
        files: [file],
      });
      return;
    }

    if (navigator.share) {
      await navigator.share({ title: game.title, text });
      return;
    }

    await navigator.clipboard.writeText(text);
  };

  const skinsResult = useMemo(() => {
    if (players.length < 2) return null;

    const wins: Record<string, number> = Object.fromEntries(players.map((player) => [player, 0]));
    const carryByHole: number[] = [];
    let carry = 1;
    for (let hole = 0; hole < holes; hole += 1) {
      carryByHole.push(carry);
      const holeScores = players.map((player) => ({ player, score: scores[player]?.[hole] ?? 99 }));
      const best = Math.min(...holeScores.map((row) => row.score));
      const winners = holeScores.filter((row) => row.score === best);
      if (winners.length === 1) {
        wins[winners[0].player] += carry;
        carry = 1;
      } else {
        carry += 1;
      }
    }
    return { wins, carryByHole, unclaimed: carry - 1 };
  }, [holes, players, scores]);

  const nassauResult = useMemo(() => {
    if (players.length < 2) return null;
    const [playerA, playerB] = players;
    const scoreA = scores[playerA] ?? [];
    const scoreB = scores[playerB] ?? [];
    const frontCount = Math.min(9, holes);
    const backStart = frontCount;
    const backCount = holes - frontCount;

    const sum = (list: number[], start: number, count: number) =>
      list.slice(start, start + count).reduce((acc, value) => acc + value, 0);
    const frontA = sum(scoreA, 0, frontCount);
    const frontB = sum(scoreB, 0, frontCount);
    const backA = sum(scoreA, backStart, backCount);
    const backB = sum(scoreB, backStart, backCount);
    const totalA = frontA + backA;
    const totalB = frontB + backB;

    const winner = (a: number, b: number) =>
      a === b ? "Tie" : a < b ? playerA : playerB;
    return {
      playerA,
      playerB,
      front: winner(frontA, frontB),
      back: backCount > 0 ? winner(backA, backB) : "N/A",
      overall: winner(totalA, totalB),
      frontA,
      frontB,
      backA,
      backB,
      totalA,
      totalB,
    };
  }, [holes, players, scores]);

  const snakeResult = useMemo(() => {
    if (players.length < 2) return null;
    const snakes: Record<string, number> = Object.fromEntries(players.map((player) => [player, 0]));
    let carry = 0;

    for (let hole = 0; hole < holes; hole += 1) {
      const holePutts = players.map((player) => ({ player, putts: putts[player]?.[hole] ?? 2 }));
      const worst = Math.max(...holePutts.map((row) => row.putts));
      if (worst < 3) {
        continue;
      }
      carry += 1;
      const losers = holePutts.filter((row) => row.putts === worst);
      if (losers.length === 1) {
        snakes[losers[0].player] += carry;
        carry = 0;
      }
    }

    const penalties = Object.fromEntries(
      players.map((player) => [player, Number((snakes[player] * stakePerPoint).toFixed(2))]),
    );
    return { snakes, penalties, unclaimed: carry };
  }, [holes, players, putts, stakePerPoint]);

  const matchPlayResult = useMemo(() => {
    if (players.length < 2) return null;
    const [playerA, playerB] = players;
    let winsA = 0;
    let winsB = 0;
    for (let hole = 0; hole < holes; hole += 1) {
      const scoreA = scores[playerA]?.[hole] ?? 99;
      const scoreB = scores[playerB]?.[hole] ?? 99;
      if (scoreA < scoreB) winsA += 1;
      if (scoreB < scoreA) winsB += 1;
    }
    const diff = Math.abs(winsA - winsB);
    const leader = winsA === winsB ? "All square" : winsA > winsB ? `${playerA} ${diff} up` : `${playerB} ${diff} up`;
    return { playerA, playerB, winsA, winsB, leader };
  }, [holes, players, scores]);

  const bestBallResult = useMemo(() => {
    if (players.length < 4) return null;
    const [a, b, c, d] = players;
    let team1 = 0;
    let team2 = 0;
    for (let hole = 0; hole < holes; hole += 1) {
      team1 += Math.min(scores[a]?.[hole] ?? 99, scores[b]?.[hole] ?? 99);
      team2 += Math.min(scores[c]?.[hole] ?? 99, scores[d]?.[hole] ?? 99);
    }
    const winner = team1 === team2 ? "Tie" : team1 < team2 ? `${a}/${b}` : `${c}/${d}`;
    return { a, b, c, d, team1, team2, winner };
  }, [holes, players, scores]);

  const wolfResult = useMemo(() => {
    if (players.length < 4) return null;
    const points: Record<string, number> = Object.fromEntries(players.map((player) => [player, 0]));

    for (let hole = 0; hole < holes; hole += 1) {
      const wolf = players[hole % players.length];
      const others = players.filter((player) => player !== wolf);
      const wolfScore = scores[wolf]?.[hole] ?? 99;
      const sortedOthers = others
        .map((player) => ({ player, score: scores[player]?.[hole] ?? 99 }))
        .sort((left, right) => left.score - right.score);
      const lowestScore = Math.min(wolfScore, ...sortedOthers.map((item) => item.score));
      const wolfIsSolo = wolfScore < lowestScore + 0.0001 && sortedOthers.filter((item) => item.score === wolfScore).length === 0;

      if (wolfIsSolo) {
        points[wolf] += 2;
        continue;
      }

      const partner = sortedOthers[0]?.player;
      const opposing = players.filter((player) => player !== wolf && player !== partner);
      const wolfTeamScore = (scores[wolf]?.[hole] ?? 99) + (scores[partner]?.[hole] ?? 99);
      const opposingScore = (scores[opposing[0]]?.[hole] ?? 99) + (scores[opposing[1]]?.[hole] ?? 99);
      if (wolfTeamScore < opposingScore) {
        points[wolf] += 1;
        if (partner) points[partner] += 1;
      } else if (opposingScore < wolfTeamScore) {
        points[opposing[0]] += 1;
        points[opposing[1]] += 1;
      }
    }

    return { points };
  }, [holes, players, scores]);

  const stablefordResult = useMemo(() => {
    if (players.length < 2) return null;
    const points: Record<string, number> = Object.fromEntries(players.map((player) => [player, 0]));
    const pointsFor = (strokes: number, par: number) => {
      const diff = strokes - par;
      if (diff <= -2) return 5;
      if (diff === -1) return 4;
      if (diff === 0) return 3;
      if (diff === 1) return 2;
      if (diff === 2) return 1;
      return 0;
    };
    players.forEach((player) => {
      for (let hole = 0; hole < holes; hole += 1) {
        points[player] += pointsFor(scores[player]?.[hole] ?? 99, pars[hole] ?? 4);
      }
    });
    return { points };
  }, [holes, pars, players, scores]);

  const overallSettlements = useMemo(() => {
    const net: Record<string, number> = {};
    games.forEach((game) => {
      game.settlements?.forEach((item) => {
        net[item.from] = (net[item.from] ?? 0) - item.amount;
        net[item.to] = (net[item.to] ?? 0) + item.amount;
      });
    });
    return settleBalances(net);
  }, [games]);

  const submitGame = (event: React.FormEvent) => {
    event.preventDefault();
    if (players.length < 2) return;
    if ((gameType === "match-play" || gameType === "nassau") && players.length < 2) return;
    if ((gameType === "best-ball-2v2" || gameType === "wolf") && players.length < 4) return;

    if (gameType === "skins" && skinsResult) {
      const summary = players
        .map((player) => `${player}: ${skinsResult.wins[player]} skins`)
        .join(" · ");
      const payout = players
        .map((player) => `${player}: ${(skinsResult.wins[player] * stakePerPoint).toFixed(2)}`)
        .join(" · ");
      const balances = balancesFromPoints(skinsResult.wins, stakePerPoint);
      const settlements = settleBalances(balances);
      onAddGame({
        id: createId(),
        type: "skins",
        date,
        title: `Skins (${holes} holes)`,
        players,
        holes,
        stakePerPoint,
        summary,
        details: `Payouts (${stakePerPoint}/skin): ${payout}${skinsResult.unclaimed ? ` · Carry-over ended with ${skinsResult.unclaimed} unclaimed skin(s).` : ""}`,
        settlements,
      });
      return;
    }

    if (gameType === "nassau" && nassauResult) {
      const points: Record<string, number> = {
        [nassauResult.playerA]: 0,
        [nassauResult.playerB]: 0,
      };
      if (nassauResult.front !== "Tie") points[nassauResult.front] += 1;
      if (nassauResult.back !== "Tie" && nassauResult.back !== "N/A") points[nassauResult.back] += 1;
      if (nassauResult.overall !== "Tie") points[nassauResult.overall] += 1;
      const settlements = settleBalances(balancesFromPoints(points, stakePerPoint));
      onAddGame({
        id: createId(),
        type: "nassau",
        date,
        title: `Nassau (${holes} holes)`,
        players,
        holes,
        stakePerPoint,
        summary: `Front: ${nassauResult.front} · Back: ${nassauResult.back} · Overall: ${nassauResult.overall}`,
        details: `${nassauResult.playerA} (${nassauResult.totalA}) vs ${nassauResult.playerB} (${nassauResult.totalB})`,
        settlements,
      });
      return;
    }

    if (gameType === "snake" && snakeResult) {
      const summary = players
        .map((player) => `${player}: ${snakeResult.snakes[player]} snakes`)
        .join(" · ");
      const details = players
        .map((player) => `${player}: -${snakeResult.penalties[player].toFixed(2)}`)
        .join(" · ");
      const balances: Record<string, number> = {};
      players.forEach((player) => {
        balances[player] = Number((-snakeResult.penalties[player]).toFixed(2));
      });
      const settlements = settleBalances(balances);
      onAddGame({
        id: createId(),
        type: "snake",
        date,
        title: `Snake (${holes} holes)`,
        players,
        holes,
        stakePerPoint,
        summary,
        details: `Penalties (${stakePerPoint}/snake): ${details}${snakeResult.unclaimed ? ` · ${snakeResult.unclaimed} unclaimed carry snake(s)` : ""}`,
        settlements,
      });
      return;
    }

    if (gameType === "match-play" && matchPlayResult) {
      const points: Record<string, number> = {
        [matchPlayResult.playerA]: matchPlayResult.winsA,
        [matchPlayResult.playerB]: matchPlayResult.winsB,
      };
      const settlements = settleBalances(balancesFromPoints(points, stakePerPoint));
      onAddGame({
        id: createId(),
        type: "match-play",
        date,
        title: `Match Play (${holes} holes)`,
        players: [matchPlayResult.playerA, matchPlayResult.playerB],
        holes,
        stakePerPoint,
        summary: `${matchPlayResult.playerA} holes won: ${matchPlayResult.winsA} · ${matchPlayResult.playerB} holes won: ${matchPlayResult.winsB}`,
        details: `Result: ${matchPlayResult.leader}`,
        settlements,
      });
      return;
    }

    if (gameType === "best-ball-2v2" && bestBallResult) {
      const teamOne = `${bestBallResult.a}/${bestBallResult.b}`;
      const teamTwo = `${bestBallResult.c}/${bestBallResult.d}`;
      const pointMap: Record<string, number> = {
        [bestBallResult.a]: bestBallResult.team2 - bestBallResult.team1,
        [bestBallResult.b]: bestBallResult.team2 - bestBallResult.team1,
        [bestBallResult.c]: bestBallResult.team1 - bestBallResult.team2,
        [bestBallResult.d]: bestBallResult.team1 - bestBallResult.team2,
      };
      const settlements = settleBalances(balancesFromPoints(pointMap, stakePerPoint / 2));
      onAddGame({
        id: createId(),
        type: "best-ball-2v2",
        date,
        title: `2v2 Best Ball (${holes} holes)`,
        players: [bestBallResult.a, bestBallResult.b, bestBallResult.c, bestBallResult.d],
        holes,
        stakePerPoint,
        summary: `${teamOne}: ${bestBallResult.team1} · ${teamTwo}: ${bestBallResult.team2}`,
        details: `Winner: ${bestBallResult.winner}`,
        settlements,
      });
      return;
    }

    if (gameType === "wolf" && wolfResult) {
      const summary = players.map((player) => `${player}: ${wolfResult.points[player]} pt`).join(" · ");
      const settlements = settleBalances(balancesFromPoints(wolfResult.points, stakePerPoint));
      onAddGame({
        id: createId(),
        type: "wolf",
        date,
        title: `Wolf (${holes} holes)`,
        players,
        holes,
        stakePerPoint,
        summary,
        details: `Auto-partner Wolf scoring`,
        settlements,
      });
      return;
    }

    if (gameType === "stableford" && stablefordResult) {
      const summary = players.map((player) => `${player}: ${stablefordResult.points[player]} pts`).join(" · ");
      const settlements = settleBalances(balancesFromPoints(stablefordResult.points, stakePerPoint));
      onAddGame({
        id: createId(),
        type: "stableford",
        date,
        title: `Stableford (${holes} holes)`,
        players,
        holes,
        stakePerPoint,
        summary,
        details: "Scoring: albatross 5, eagle 4, birdie 3, par 2, bogey 1, double+ 0",
        settlements,
      });
    }
  };

  return (
    <section className="space-y-4">
      <form onSubmit={submitGame} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Betting Games</h3>
        <p className="mt-1 text-sm text-slate-600">
          Calculate Skins, Nassau, Snake, Match Play, 2v2 Best Ball, Wolf, and Stableford with settlement output.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-slate-600">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Game</span>
            <select
              value={gameType}
              onChange={(event) => setGameType(event.target.value as BettingGameType)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="skins">Skins</option>
              <option value="nassau">Nassau (first 2 players)</option>
              <option value="snake">Snake</option>
              <option value="match-play">Match Play (first 2 players)</option>
              <option value="best-ball-2v2">2v2 Best Ball (first 4 players)</option>
              <option value="wolf">Wolf (4+ players)</option>
              <option value="stableford">Stableford</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-slate-600">Players (comma separated)</span>
            <input
              value={playerNamesInput}
              onChange={(event) => setPlayerNamesInput(event.target.value)}
              onBlur={ensureScoreShape}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="You, Friend 1, Friend 2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Holes</span>
            <select
              value={holes}
              onChange={(event) => setHoles(Number(event.target.value) as HoleCount)}
              onBlur={ensureScoreShape}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value={9}>9</option>
              <option value={18}>18</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Stake per point / skin</span>
            <input
              type="number"
              min={1}
              value={stakePerPoint}
              onChange={(event) => setStakePerPoint(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-800">Enter hole scores</p>
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-2">Player</th>
                {Array.from({ length: holes }, (_value, index) => (
                  <th key={index} className="py-1 px-1 text-center">
                    {index + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gameType === "stableford" && (
                <tr className="border-t border-slate-200">
                  <td className="py-1 pr-2 font-semibold text-slate-700">Par</td>
                  {Array.from({ length: holes }, (_value, index) => (
                    <td key={`par-${index}`} className="px-1 py-1">
                      <input
                        type="number"
                        min={3}
                        max={6}
                        value={pars[index] ?? 4}
                        onChange={(event) => updatePar(index, Number(event.target.value))}
                        className="w-12 rounded border border-slate-300 px-1 py-1 text-center"
                      />
                    </td>
                  ))}
                </tr>
              )}
              {players.map((player) => (
                <tr key={player} className="border-t border-slate-200">
                  <td className="py-1 pr-2 font-semibold text-slate-700">{player}</td>
                  {Array.from({ length: holes }, (_value, index) => (
                    <td key={`${player}-${index}`} className="px-1 py-1">
                      <input
                        type="number"
                        min={1}
                        value={scores[player]?.[index] ?? 4}
                        onChange={(event) => updateScore(player, index, Number(event.target.value))}
                        className="w-12 rounded border border-slate-300 px-1 py-1 text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {gameType === "snake" && (
          <div className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-800">Enter putts per hole</p>
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-2">Player</th>
                  {Array.from({ length: holes }, (_value, index) => (
                    <th key={index} className="py-1 px-1 text-center">
                      {index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={`putts-${player}`} className="border-t border-slate-200">
                    <td className="py-1 pr-2 font-semibold text-slate-700">{player}</td>
                    {Array.from({ length: holes }, (_value, index) => (
                      <td key={`${player}-putt-${index}`} className="px-1 py-1">
                        <input
                          type="number"
                          min={0}
                          max={6}
                          value={putts[player]?.[index] ?? 2}
                          onChange={(event) => updatePutts(player, index, Number(event.target.value))}
                          className="w-12 rounded border border-slate-300 px-1 py-1 text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(gameType === "best-ball-2v2" || gameType === "wolf") && players.length < 4 && (
          <p className="mt-3 text-sm text-rose-600">This game requires at least 4 players.</p>
        )}

        {gameType === "skins" && skinsResult && (
          <p className="mt-3 text-sm text-slate-700">
            Result:{" "}
            {players.map((player) => `${player} ${skinsResult.wins[player]}`).join(" · ")}{" "}
            {skinsResult.unclaimed ? `· ${skinsResult.unclaimed} unclaimed skin(s)` : ""}
          </p>
        )}

        {gameType === "nassau" && nassauResult && (
          <p className="mt-3 text-sm text-slate-700">
            Result: Front {nassauResult.front} · Back {nassauResult.back} · Overall {nassauResult.overall}
          </p>
        )}

        {gameType === "snake" && snakeResult && (
          <p className="mt-3 text-sm text-slate-700">
            Result:{" "}
            {players.map((player) => `${player} ${snakeResult.snakes[player]}`).join(" · ")}{" "}
            {snakeResult.unclaimed ? `· ${snakeResult.unclaimed} carry snake(s) unclaimed` : ""}
          </p>
        )}

        {gameType === "match-play" && matchPlayResult && (
          <p className="mt-3 text-sm text-slate-700">
            Result: {matchPlayResult.leader}
          </p>
        )}

        {gameType === "best-ball-2v2" && bestBallResult && (
          <p className="mt-3 text-sm text-slate-700">
            Result: {bestBallResult.a}/{bestBallResult.b} {bestBallResult.team1} · {bestBallResult.c}/
            {bestBallResult.d} {bestBallResult.team2} · Winner: {bestBallResult.winner}
          </p>
        )}

        {gameType === "wolf" && wolfResult && (
          <p className="mt-3 text-sm text-slate-700">
            Result: {players.map((player) => `${player} ${wolfResult.points[player]}`).join(" · ")}
          </p>
        )}

        {gameType === "stableford" && stablefordResult && (
          <p className="mt-3 text-sm text-slate-700">
            Result: {players.map((player) => `${player} ${stablefordResult.points[player]} pts`).join(" · ")}
          </p>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Save betting result
        </button>
      </form>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Betting History</h3>
        {overallSettlements.length > 0 && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Overall settlement</p>
            <ul className="mt-1 space-y-1 text-xs text-emerald-900">
              {overallSettlements.map((item, index) => (
                <li key={`${item.from}-${item.to}-${index}`}>
                  {item.from} pays {item.to} {item.amount.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {games.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No betting games saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {games
              .slice()
              .reverse()
              .map((game) => (
                <li key={game.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {game.date} · {game.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{game.summary}</p>
                      {game.details && <p className="mt-1 text-xs text-slate-500">{game.details}</p>}
                      {game.settlements && game.settlements.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                          {game.settlements.map((settlement, index) => (
                            <li key={`${game.id}-${index}`}>
                              {settlement.from} pays {settlement.to} {settlement.amount.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => void shareGame(game)}
                        className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                      >
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGame(game.id)}
                        className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </article>
    </section>
  );
}
