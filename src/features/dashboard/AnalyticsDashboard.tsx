import { StatCard } from "../../components/StatCard";
import type { AppData } from "../../types/app";
import {
  getBiggestLeak,
  getBettingNetByPlayer,
  getClubDistanceStats,
  getLeagueLeaderboard,
  getPuttingSummary,
  getScoreSummary,
  getWedgeBuckets,
} from "../../utils/analytics";

type AnalyticsDashboardProps = {
  data: AppData;
};

const formatSigned = (value: number) => (value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1));

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const scoreSummary = getScoreSummary(data.rounds);
  const puttingSummary = getPuttingSummary(data.rounds);
  const wedgeBuckets = getWedgeBuckets(data.rounds);
  const clubStats = getClubDistanceStats(data.clubShots);
  const bettingTotals = getBettingNetByPlayer(data);
  const leaderboard = getLeagueLeaderboard(data);
  const leak = getBiggestLeak(data.rounds);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Rounds Played" value={`${scoreSummary.roundsPlayed}`} />
        <StatCard label="Avg Score" value={scoreSummary.averageScore ? scoreSummary.averageScore.toFixed(1) : "--"} />
        <StatCard
          label="Avg vs Par"
          value={scoreSummary.roundsPlayed ? formatSigned(scoreSummary.averageDiffToPar) : "--"}
          tone={scoreSummary.averageDiffToPar <= 0 ? "success" : "warning"}
        />
        <StatCard
          label="Putts / Hole"
          value={puttingSummary.totalHoles ? puttingSummary.puttsPerHole.toFixed(2) : "--"}
        />
      </div>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Biggest Stroke Leak</h3>
        <p className="mt-2 text-sm font-medium text-amber-700">{leak.area}</p>
        <p className="text-sm text-slate-600">{leak.message}</p>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Wedge Distance Analytics</h3>
        <div className="mt-3 space-y-2">
          {wedgeBuckets.map((bucket) => (
            <div key={bucket.label} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <p className="font-semibold text-slate-800">{bucket.label}</p>
                <p className="text-slate-500">{bucket.samples} shots</p>
              </div>
              <p className="mt-1 text-sm text-slate-700">
                Avg leave distance:{" "}
                <span className="font-semibold">
                  {bucket.samples ? `${bucket.averageProximity.toFixed(1)} ft` : "--"}
                </span>
              </p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Putting Efficiency</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard
            label="1-Putt Rate"
            value={puttingSummary.totalHoles ? `${puttingSummary.onePuttRate.toFixed(1)}%` : "--"}
            tone="success"
          />
          <StatCard
            label="3-Putt Rate"
            value={puttingSummary.totalHoles ? `${puttingSummary.threePuttRate.toFixed(1)}%` : "--"}
            tone="warning"
          />
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Club Distance Summary</h3>
        {clubStats.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No club shots yet. Add shots in the Clubs tab.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-1 pr-3">Club</th>
                  <th className="py-1 pr-3">Avg</th>
                  <th className="py-1 pr-3">Min</th>
                  <th className="py-1 pr-3">Max</th>
                  <th className="py-1 pr-3">Samples</th>
                </tr>
              </thead>
              <tbody>
                {clubStats.map((club) => (
                  <tr key={club.club} className="border-t border-slate-100 text-slate-700">
                    <td className="py-2 pr-3 font-semibold">{club.club}</td>
                    <td className="py-2 pr-3">{club.average.toFixed(1)} yd</td>
                    <td className="py-2 pr-3">{club.min.toFixed(0)} yd</td>
                    <td className="py-2 pr-3">{club.max.toFixed(0)} yd</td>
                    <td className="py-2 pr-3">{club.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Betting & League Snapshot</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Betting Net</p>
            {bettingTotals.length === 0 ? (
              <p className="mt-1 text-sm text-slate-600">No betting games logged yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {bettingTotals.slice(0, 4).map((row) => (
                  <li key={row.player} className="flex justify-between">
                    <span>{row.player}</span>
                    <span className={row.net >= 0 ? "text-emerald-700" : "text-rose-700"}>
                      {row.net >= 0 ? "+" : ""}
                      {row.net.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">League Leaderboard</p>
            {leaderboard.every((row) => row.rounds === 0) ? (
              <p className="mt-1 text-sm text-slate-600">No league rounds yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {leaderboard.slice(0, 4).map((row) => (
                  <li key={row.player} className="flex justify-between">
                    <span>{row.player}</span>
                    <span className="font-semibold text-slate-700">{row.points.toFixed(0)} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
