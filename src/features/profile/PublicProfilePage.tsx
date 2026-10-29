import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatCard } from "../../components/StatCard";
import { initialAppData } from "../../data/defaultData";
import { loadPublicAppDataByShareCode } from "../../services/appDataSyncService";
import { getGirSummary, getPuttingSummary, getScoreSummary } from "../../utils/analytics";

export function PublicProfilePage() {
  const { shareCode = "" } = useParams<{ shareCode: string }>();
  const [displayName, setDisplayName] = useState("Player");
  const [data, setData] = useState(initialAppData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await loadPublicAppDataByShareCode(shareCode);
        if (!active) return;
        if (!snapshot) {
          setError("Public profile not found or disabled.");
          return;
        }
        setDisplayName(snapshot.displayName);
        setData({ ...initialAppData, ...snapshot.appData });
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load shared profile.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [shareCode]);

  const scoreSummary = useMemo(() => getScoreSummary(data.rounds), [data.rounds]);
  const puttingSummary = useMemo(() => getPuttingSummary(data.rounds), [data.rounds]);
  const girSummary = useMemo(() => getGirSummary(data.rounds), [data.rounds]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">{displayName}&apos;s Golf Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Read-only shared stats from GolfPro Companion.</p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
        ) : error ? (
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Rounds" value={`${scoreSummary.roundsPlayed}`} />
              <StatCard
                label="Avg Score"
                value={scoreSummary.roundsPlayed ? scoreSummary.averageScore.toFixed(1) : "--"}
              />
              <StatCard
                label="Putts / Hole"
                value={puttingSummary.totalHoles ? puttingSummary.puttsPerHole.toFixed(2) : "--"}
              />
              <StatCard
                label="GIR %"
                value={girSummary.totalHoles ? `${girSummary.rate.toFixed(1)}%` : "--"}
              />
            </div>

            <article className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">Recent rounds</p>
              {data.rounds.length === 0 ? (
                <p className="mt-2 text-xs text-slate-600">No rounds shared yet.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs text-slate-700">
                  {data.rounds
                    .slice()
                    .reverse()
                    .slice(0, 8)
                    .map((round) => (
                      <li key={round.id} className="flex justify-between">
                        <span>
                          {round.date} · {round.course}
                        </span>
                        <span>
                          {round.totalScore} ({round.totalScore - round.par >= 0 ? "+" : ""}
                          {round.totalScore - round.par})
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </article>
          </>
        )}

        <p className="mt-5 text-xs text-slate-500">
          Powered by GolfPro Companion ·{" "}
          <Link to="/login" className="font-semibold text-emerald-700">
            Open app
          </Link>
        </p>
      </section>
    </main>
  );
}
