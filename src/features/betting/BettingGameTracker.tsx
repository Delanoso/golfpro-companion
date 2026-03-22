import { useMemo, useState } from "react";
import type { AppData, BettingGame, BettingGameType, BettingResult } from "../../types/app";
import { getBettingNetByPlayer } from "../../utils/analytics";
import { createId, todayIsoDate } from "../../utils/helpers";

type BettingGameTrackerProps = {
  data: AppData;
  onAddGame: (game: BettingGame) => void;
  onDeleteGame: (id: string) => void;
};

type PlayerDraft = {
  player: string;
  points: number;
  netAmount: number;
};

export function BettingGameTracker({ data, onAddGame, onDeleteGame }: BettingGameTrackerProps) {
  const [date, setDate] = useState(todayIsoDate());
  const [gameType, setGameType] = useState<BettingGameType>("Vegas");
  const [stakePerPoint, setStakePerPoint] = useState(1);
  const [playersCsv, setPlayersCsv] = useState("You,Friend 1,Friend 2,Friend 3");
  const [notes, setNotes] = useState("");

  const players = useMemo(
    () =>
      playersCsv
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [playersCsv],
  );

  const [playerDrafts, setPlayerDrafts] = useState<PlayerDraft[]>([]);

  const syncPlayers = () => {
    setPlayerDrafts(
      players.map((player) => {
        const existing = playerDrafts.find((draft) => draft.player === player);
        return existing ?? { player, points: 0, netAmount: 0 };
      }),
    );
  };

  const updateDraft = (player: string, key: "points" | "netAmount", value: number) => {
    setPlayerDrafts((current) =>
      current.map((draft) =>
        draft.player === player
          ? {
              ...draft,
              [key]: value,
            }
          : draft,
      ),
    );
  };

  const submitGame = (event: React.FormEvent) => {
    event.preventDefault();
    const results: BettingResult[] = playerDrafts
      .filter((draft) => draft.player.trim().length > 0)
      .map((draft) => ({
        player: draft.player,
        points: draft.points,
        netAmount: draft.netAmount,
      }));

    if (results.length === 0) return;

    onAddGame({
      id: createId(),
      date,
      gameType,
      stakePerPoint,
      results,
      notes: notes.trim() || undefined,
    });
  };

  const bettingTotals = getBettingNetByPlayer(data);

  return (
    <section className="space-y-4">
      <form onSubmit={submitGame} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Betting & Social Game Entry</h3>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Game Type</span>
            <select
              value={gameType}
              onChange={(event) => setGameType(event.target.value as BettingGameType)}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="Vegas">Vegas</option>
              <option value="Banker">Banker</option>
              <option value="Hammer">Hammer</option>
            </select>
          </label>
          <label className="min-w-0 text-sm sm:col-span-2">
            <span className="text-slate-600">Players (comma separated)</span>
            <input
              value={playersCsv}
              onChange={(event) => setPlayersCsv(event.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
              placeholder="You,Friend 1,Friend 2"
            />
          </label>
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Stake per point</span>
            <input
              type="number"
              value={stakePerPoint}
              onChange={(event) => setStakePerPoint(Number(event.target.value))}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={syncPlayers}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white sm:self-end"
          >
            Load player result rows
          </button>
        </div>

        {playerDrafts.length > 0 && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Results</p>
            <div className="mt-2 space-y-2">
              {playerDrafts.map((draft) => (
                <div key={draft.player} className="grid grid-cols-[1fr_1fr_1fr] gap-2">
                  <p className="rounded-lg bg-white px-2 py-2 text-sm">{draft.player}</p>
                  <input
                    type="number"
                    value={draft.points}
                    onChange={(event) => updateDraft(draft.player, "points", Number(event.target.value))}
                    className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    placeholder="Points"
                  />
                  <input
                    type="number"
                    value={draft.netAmount}
                    onChange={(event) => updateDraft(draft.player, "netAmount", Number(event.target.value))}
                    className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    placeholder="Net amount"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="mt-3 block text-sm">
          <span className="text-slate-600">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Save betting game
        </button>
      </form>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Net Winnings Leaderboard</h3>
        {bettingTotals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No games logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {bettingTotals.map((row) => (
              <li key={row.player} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{row.player}</span>
                <span className={row.net >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {row.net >= 0 ? "+" : ""}
                  {row.net.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Game History</h3>
        {data.bettingGames.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No games saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.bettingGames
              .slice()
              .reverse()
              .map((game) => (
                <li key={game.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {game.gameType} · {game.date}
                      </p>
                      <p className="text-xs text-slate-500">Stake per point: {game.stakePerPoint}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteGame(game.id)}
                      className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                    {game.results.map((result) => (
                      <li key={`${game.id}-${result.player}`} className="flex justify-between">
                        <span>
                          {result.player} ({result.points} pts)
                        </span>
                        <span className={result.netAmount >= 0 ? "text-emerald-700" : "text-rose-700"}>
                          {result.netAmount >= 0 ? "+" : ""}
                          {result.netAmount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        )}
      </article>
    </section>
  );
}
