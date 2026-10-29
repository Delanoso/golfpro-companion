import { useMemo, useState } from "react";
import type { BettingGameType, HoleCount } from "../../types/app";
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

export function BettingGamesManager({ games, onAddGame, onDeleteGame }: BettingGamesManagerProps) {
  const [date, setDate] = useState(todayIsoDate());
  const [gameType, setGameType] = useState<BettingGameType>("skins");
  const [playerNamesInput, setPlayerNamesInput] = useState("You, Friend 1, Friend 2, Friend 3");
  const [holes, setHoles] = useState<HoleCount>(18);
  const [stakePerPoint, setStakePerPoint] = useState(20);
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

  const submitGame = (event: React.FormEvent) => {
    event.preventDefault();
    if (players.length < 2) return;

    if (gameType === "skins" && skinsResult) {
      const summary = players
        .map((player) => `${player}: ${skinsResult.wins[player]} skins`)
        .join(" · ");
      const payout = players
        .map((player) => `${player}: ${(skinsResult.wins[player] * stakePerPoint).toFixed(2)}`)
        .join(" · ");
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
      });
      return;
    }

    if (gameType === "nassau" && nassauResult) {
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
      });
      return;
    }

    if (gameType === "match-play" && matchPlayResult) {
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
      });
    }
  };

  return (
    <section className="space-y-4">
      <form onSubmit={submitGame} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Betting Games</h3>
        <p className="mt-1 text-sm text-slate-600">
          Calculate results for Skins, Nassau, Snake, and Match Play, then save the result card.
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

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Save betting result
        </button>
      </form>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Betting History</h3>
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
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteGame(game.id)}
                      className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </article>
    </section>
  );
}
