import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AppData, LeagueRound } from "../../types/app";
import {
  createSharedLeague,
  getMySharedLeagues,
  getSharedLeagueMembers,
  getSharedLeagueRounds,
  joinSharedLeagueByCode,
  linkRoundToLeague,
  type SharedLeague,
  type SharedLeagueMember,
  type SharedLeagueRound,
} from "../../services/leagueService";
import { getLeagueLeaderboard } from "../../utils/analytics";
import { clamp, createId, todayIsoDate } from "../../utils/helpers";

type LeagueManagerProps = {
  currentUser: User;
  data: AppData;
  rounds: AppData["rounds"];
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

const getDisplayName = (user: User) =>
  (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()) ||
  user.email?.split("@")[0] ||
  "Player";

export function LeagueManager({
  currentUser,
  data,
  rounds,
  onUpdateSettings,
  onAddRound,
  onDeleteRound,
}: LeagueManagerProps) {
  const [newPlayer, setNewPlayer] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [course, setCourse] = useState("League Day");
  const [par, setPar] = useState(72);
  const [grossScores, setGrossScores] = useState<Record<string, number>>({});
  const [newLeagueName, setNewLeagueName] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [sharedLeagues, setSharedLeagues] = useState<SharedLeague[]>([]);
  const [sharedMembers, setSharedMembers] = useState<SharedLeagueMember[]>([]);
  const [sharedRounds, setSharedRounds] = useState<SharedLeagueRound[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedStatus, setSharedStatus] = useState<string | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);

  const leaderboard = getLeagueLeaderboard(data);
  const selectedLeague = sharedLeagues.find((league) => league.id === selectedLeagueId) ?? null;
  const displayName = getDisplayName(currentUser);

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

  const refreshSharedLeagues = async () => {
    setSharedLoading(true);
    setSharedError(null);
    try {
      const leagues = await getMySharedLeagues(currentUser.id);
      setSharedLeagues(leagues);
      const lastJoined = localStorage.getItem("golfpro-last-joined-league");
      if (leagues.length === 0) {
        setSelectedLeagueId("");
      } else if (lastJoined && leagues.some((league) => league.id === lastJoined)) {
        setSelectedLeagueId(lastJoined);
        localStorage.removeItem("golfpro-last-joined-league");
      } else if (!leagues.some((league) => league.id === selectedLeagueId)) {
        setSelectedLeagueId(leagues[0].id);
      }
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : "Unable to load shared leagues.");
    } finally {
      setSharedLoading(false);
    }
  };

  const refreshSelectedLeagueDetails = async (leagueId: string) => {
    if (!leagueId) {
      setSharedMembers([]);
      setSharedRounds([]);
      return;
    }
    try {
      const [members, linkedRounds] = await Promise.all([
        getSharedLeagueMembers(leagueId),
        getSharedLeagueRounds(leagueId),
      ]);
      setSharedMembers(members);
      setSharedRounds(linkedRounds);
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : "Unable to load league details.");
    }
  };

  useEffect(() => {
    void refreshSharedLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  useEffect(() => {
    void refreshSelectedLeagueDetails(selectedLeagueId);
  }, [selectedLeagueId]);

  const createLeague = async (event: React.FormEvent) => {
    event.preventDefault();
    setSharedError(null);
    setSharedStatus(null);
    try {
      const created = await createSharedLeague(newLeagueName, currentUser, displayName);
      setNewLeagueName("");
      setSharedStatus(`League "${created.name}" created.`);
      await refreshSharedLeagues();
      setSelectedLeagueId(created.id);
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : "Unable to create league.");
    }
  };

  const joinLeague = async (event: React.FormEvent) => {
    event.preventDefault();
    setSharedError(null);
    setSharedStatus(null);
    try {
      const joined = await joinSharedLeagueByCode(inviteCodeInput, currentUser, displayName);
      setInviteCodeInput("");
      setSharedStatus(`Joined league "${joined.name}".`);
      await refreshSharedLeagues();
      setSelectedLeagueId(joined.id);
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : "Unable to join league.");
    }
  };

  const copyInviteLink = async () => {
    if (!selectedLeague) return;
    const link = `${window.location.origin}/join/${selectedLeague.inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setSharedStatus("Invite link copied.");
      setSharedError(null);
    } catch {
      setSharedError("Clipboard copy failed. Copy the invite code manually.");
      setSharedStatus(null);
    }
  };

  const submitLinkedRound = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLeagueId || !selectedRoundId) return;
    const selectedRound = rounds.find((round) => round.id === selectedRoundId);
    if (!selectedRound) {
      setSharedError("Selected scorecard was not found.");
      return;
    }

    setSharedError(null);
    setSharedStatus(null);
    try {
      await linkRoundToLeague(selectedLeagueId, selectedRound, currentUser.id, displayName);
      setSharedStatus("Scorecard linked to league.");
      await refreshSelectedLeagueDetails(selectedLeagueId);
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : "Unable to link scorecard.");
    }
  };

  const sharedLeaderboard = useMemo(() => {
    const byPlayer = new Map<string, { rounds: number; totalScore: number; totalVsPar: number; wins: number }>();
    const groupedByRoundKey = new Map<string, SharedLeagueRound[]>();

    sharedRounds.forEach((row) => {
      const current = byPlayer.get(row.displayName) ?? {
        rounds: 0,
        totalScore: 0,
        totalVsPar: 0,
        wins: 0,
      };
      current.rounds += 1;
      current.totalScore += row.totalScore;
      current.totalVsPar += row.totalScore - row.par;
      byPlayer.set(row.displayName, current);

      const key = `${row.roundDate}-${row.course}`;
      groupedByRoundKey.set(key, [...(groupedByRoundKey.get(key) ?? []), row]);
    });

    groupedByRoundKey.forEach((roundRows) => {
      const best = Math.min(...roundRows.map((row) => row.totalScore));
      const winners = roundRows.filter((row) => row.totalScore === best);
      if (winners.length === 1) {
        const stats = byPlayer.get(winners[0].displayName);
        if (stats) stats.wins += 1;
      }
    });

    return Array.from(byPlayer.entries())
      .map(([player, stats]) => ({
        player,
        rounds: stats.rounds,
        averageScore: stats.totalScore / stats.rounds,
        averageVsPar: stats.totalVsPar / stats.rounds,
        wins: stats.wins,
      }))
      .sort((a, b) => b.wins - a.wins || a.averageScore - b.averageScore);
  }, [sharedRounds]);

  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Shared League (Invite + Linked Scorecards)</h3>
        <p className="mt-1 text-sm text-slate-600">
          Create a league, share invite link/code, and link your scorecards so all members can view
          everyone&apos;s rounds.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <form onSubmit={createLeague} className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Create league</p>
            <input
              value={newLeagueName}
              onChange={(event) => setNewLeagueName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="League name"
            />
            <button
              type="submit"
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Create
            </button>
          </form>

          <form onSubmit={joinLeague} className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Join league via invite code</p>
            <input
              value={inviteCodeInput}
              onChange={(event) => setInviteCodeInput(event.target.value.toUpperCase())}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
              placeholder="AB12CD34"
            />
            <button
              type="submit"
              className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
            >
              Join
            </button>
          </form>
        </div>

        {sharedError && <p className="mt-3 text-sm text-rose-600">{sharedError}</p>}
        {sharedStatus && <p className="mt-3 text-sm text-emerald-700">{sharedStatus}</p>}

        <div className="mt-3">
          <label className="text-sm">
            <span className="text-slate-600">Your leagues</span>
            <select
              value={selectedLeagueId}
              onChange={(event) => setSelectedLeagueId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              disabled={sharedLoading || sharedLeagues.length === 0}
            >
              <option value="">{sharedLeagues.length ? "Select league" : "No leagues yet"}</option>
              {sharedLeagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedLeague && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
            <p className="text-sm font-semibold text-emerald-900">{selectedLeague.name}</p>
            <p className="mt-1 text-xs text-emerald-900/90">
              Invite code: <span className="font-semibold">{selectedLeague.inviteCode}</span>
            </p>
            <p className="mt-1 break-all text-xs text-emerald-900/90">
              Link: {window.location.origin}/join/{selectedLeague.inviteCode}
            </p>
            <button
              type="button"
              onClick={() => void copyInviteLink()}
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Copy invite link
            </button>
          </div>
        )}

        {selectedLeague && (
          <form onSubmit={submitLinkedRound} className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Link your saved scorecard</p>
            <select
              value={selectedRoundId}
              onChange={(event) => setSelectedRoundId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select round</option>
              {rounds
                .slice()
                .reverse()
                .map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.date} · {round.course} · {round.totalScore}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={!selectedRoundId}
              className="mt-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Link scorecard
            </button>
          </form>
        )}

        {selectedLeague && (
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">Members ({sharedMembers.length})</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {sharedMembers.map((member) => (
                  <li key={member.id} className="flex justify-between">
                    <span>{member.displayName}</span>
                    <span className="text-xs text-slate-500">
                      {member.userId === selectedLeague.ownerId ? "Owner" : "Member"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">Shared leaderboard</p>
              {sharedLeaderboard.length === 0 ? (
                <p className="mt-2 text-xs text-slate-600">No linked scorecards yet.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {sharedLeaderboard.map((row) => (
                    <li key={row.player} className="flex justify-between">
                      <span>{row.player}</span>
                      <span className="text-xs">
                        {row.wins} win(s) · Avg {row.averageScore.toFixed(1)} · Vs Par{" "}
                        {row.averageVsPar > 0 ? "+" : ""}
                        {row.averageVsPar.toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {selectedLeague && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Linked scorecards</p>
            {sharedRounds.length === 0 ? (
              <p className="mt-2 text-xs text-slate-600">No scorecards linked yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {sharedRounds.map((row) => (
                  <li key={row.id} className="flex justify-between">
                    <span>
                      {row.roundDate} · {row.displayName} · {row.course}
                    </span>
                    <span>
                      Score {row.totalScore} ({row.totalScore - row.par >= 0 ? "+" : ""}
                      {row.totalScore - row.par})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">League Settings</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-sm">
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
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="min-w-0 text-sm">
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
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
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
            <span className="text-slate-600">Course</span>
            <input
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Par</span>
            <input
              type="number"
              value={par}
              onChange={(event) => setPar(Number(event.target.value))}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
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
