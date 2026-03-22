import { useMemo, useState } from "react";
import type { AppData, LeagueRound } from "../../types/app";
import { getLeagueLeaderboard } from "../../utils/analytics";
import { clamp, createId, todayIsoDate } from "../../utils/helpers";

type LeagueManagerProps = {
  data: AppData;
  onUpdateSettings: (settings: AppData["leagueSettings"]) => void;
  onAddRound: (round: LeagueRound) => void;
  onDeleteRound: (id: string) => void;
};

const calculateHandicap = (data: AppData, player: string, par: number) => {
  const history = data.leagueRounds
    .flatMap((round) => round.playerRounds)
    .filter((row) => row.player === player)
    .slice(-6);

  if (history.length === 0) return 0;
  const avgOverPar =
    history.reduce((sum, row) => sum + (row.grossScore - par), 0) / Math.max(1, history.length);
  return clamp(avgOverPar * 0.85, 0, 30);
};

export function LeagueManager({ data, onUpdateSettings, onAddRound, onDeleteRound }: LeagueManagerProps) {
  const [newPlayer, setNewPlayer] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [course, setCourse] = useState("League Day");
  const [par, setPar] = useState(72);
  const [grossScores, setGrossScores] = useState<Record<string, number>>({});

  const leaderboard = getLeagueLeaderboard(data);

  const players = data.leagueSettings.players;

  const scoresWithDefaults = useMemo(() => {
    const defaults: Record<string, number> = {};
    players.forEach((player) => {
      defaults[player] = grossScores[player] ?? par + 10;
    });
    return defaults;
  }, [grossScores, par, players]);

  const addPlayer = () => {
    const player = newPlayer.trim();
    if (!player || players.includes(player)) return;
    onUpdateSettings({
      ...data.leagueSettings,
      players: [...players, player],
    });
    setNewPlayer("");
  };

  const removePlayer = (player: string) => {
    onUpdateSettings({
      ...data.leagueSettings,
      players: players.filter((name) => name !== player),
    });
  };

  const submitLeagueRound = (event: React.FormEvent) => {
    event.preventDefault();
    if (players.length === 0) return;

    const playerRounds = players.map((player) => {
      const grossScore = scoresWithDefaults[player];
      const handicap = calculateHandicap(data, player, par);
      const netScore = grossScore - handicap;
      return {
        player,
        grossScore,
        handicap,
        netScore,
        pointsAwarded: 0,
      };
    });

    const bestNet = Math.min(...playerRounds.map((row) => row.netScore));
    const winnerSet = new Set(playerRounds.filter((row) => row.netScore === bestNet).map((row) => row.player));

    const withPoints = playerRounds.map((row) => ({
      ...row,
      pointsAwarded:
        data.leagueSettings.participationPoints +
        (winnerSet.has(row.player) ? data.leagueSettings.winnerPoints : 0),
    }));

    onAddRound({
      id: createId(),
      date,
      course,
      par,
      playerRounds: withPoints,
    });
  };

  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">League Settings</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-slate-600">Winner points</span>
            <input
              type="number"
              value={data.leagueSettings.winnerPoints}
              onChange={(event) =>
                onUpdateSettings({
                  ...data.leagueSettings,
                  winnerPoints: Number(event.target.value),
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Participation points</span>
            <input
              type="number"
              value={data.leagueSettings.participationPoints}
              onChange={(event) =>
                onUpdateSettings({
                  ...data.leagueSettings,
                  participationPoints: Number(event.target.value),
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">Players</p>
          <div className="mt-2 flex gap-2">
            <input
              value={newPlayer}
              onChange={(event) => setNewPlayer(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Add player"
            />
            <button
              type="button"
              onClick={addPlayer}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Add
            </button>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {players.map((player) => (
              <li key={player} className="flex items-center justify-between rounded-lg bg-white px-2 py-1">
                <span>{player}</span>
                <button
                  type="button"
                  onClick={() => removePlayer(player)}
                  className="text-xs font-semibold text-rose-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </article>

      <form onSubmit={submitLeagueRound} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">New League Round</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
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
            <span className="text-slate-600">Course</span>
            <input
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Par</span>
            <input
              type="number"
              value={par}
              onChange={(event) => setPar(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
          {players.map((player) => (
            <label key={player} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-slate-800">{player}</span>
              <input
                type="number"
                value={scoresWithDefaults[player]}
                onChange={(event) =>
                  setGrossScores((current) => ({
                    ...current,
                    [player]: Number(event.target.value),
                  }))
                }
                className="w-28 rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Save league round
        </button>
      </form>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Add players and league rounds to rank performance.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-1 pr-3">Player</th>
                  <th className="py-1 pr-3">Points</th>
                  <th className="py-1 pr-3">Avg Gross</th>
                  <th className="py-1 pr-3">Avg Net</th>
                  <th className="py-1 pr-3">HCP</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr key={row.player} className="border-t border-slate-100 text-slate-700">
                    <td className="py-2 pr-3 font-semibold">{row.player}</td>
                    <td className="py-2 pr-3">{row.points.toFixed(0)}</td>
                    <td className="py-2 pr-3">{row.rounds ? row.averageGross.toFixed(1) : "--"}</td>
                    <td className="py-2 pr-3">{row.rounds ? row.averageNet.toFixed(1) : "--"}</td>
                    <td className="py-2 pr-3">{row.currentHandicap.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">League Round History</h3>
        {data.leagueRounds.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No league rounds saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.leagueRounds
              .slice()
              .reverse()
              .map((round) => (
                <li key={round.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      {round.date} · {round.course}
                    </p>
                    <button
                      type="button"
                      onClick={() => onDeleteRound(round.id)}
                      className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                    {round.playerRounds.map((playerRound) => (
                      <li key={`${round.id}-${playerRound.player}`} className="flex justify-between">
                        <span>{playerRound.player}</span>
                        <span>
                          Gross {playerRound.grossScore} · Net {playerRound.netScore.toFixed(1)} · +
                          {playerRound.pointsAwarded}
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
