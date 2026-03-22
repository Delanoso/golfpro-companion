import { useMemo, useState } from "react";
import type { ClubShot } from "../../types/app";
import { getClubDistanceStats } from "../../utils/analytics";

type SmartCaddyProps = {
  clubShots: ClubShot[];
};

type Recommendation = {
  club: string;
  average: number;
  gap: number;
  samples: number;
};

const mode = (values: string[]) => {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
};

export function SmartCaddy({ clubShots }: SmartCaddyProps) {
  const [targetDistance, setTargetDistance] = useState(150);
  const [windAdjustment, setWindAdjustment] = useState(0);
  const [elevationAdjustment, setElevationAdjustment] = useState(0);
  const [temperatureAdjustment, setTemperatureAdjustment] = useState(0);

  const adjustedDistance =
    targetDistance + windAdjustment + elevationAdjustment + temperatureAdjustment;

  const recommendations = useMemo<Recommendation[]>(() => {
    return getClubDistanceStats(clubShots)
      .map((club) => ({
        club: club.club,
        average: club.average,
        samples: club.samples,
        gap: Math.abs(club.average - adjustedDistance),
      }))
      .sort((a, b) => a.gap - b.gap);
  }, [adjustedDistance, clubShots]);

  const best = recommendations[0];
  const backup = recommendations[1];

  const bias = useMemo(() => {
    if (!best) return "N/A";
    const shapes = clubShots.filter((shot) => shot.club === best.club).map((shot) => shot.shotShape);
    return mode(shapes);
  }, [best, clubShots]);

  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Smart "Caddy" Strategy</h3>
        <p className="mt-1 text-sm text-slate-600">
          Recommends clubs using your own historical distances, not tour-average numbers.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-slate-600">Target distance (yd)</span>
            <input
              type="number"
              value={targetDistance}
              onChange={(event) => setTargetDistance(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Wind adjust (yd)</span>
            <input
              type="number"
              value={windAdjustment}
              onChange={(event) => setWindAdjustment(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Elevation adjust (yd)</span>
            <input
              type="number"
              value={elevationAdjustment}
              onChange={(event) => setElevationAdjustment(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Temperature adjust (yd)</span>
            <input
              type="number"
              value={temperatureAdjustment}
              onChange={(event) => setTemperatureAdjustment(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          Adjusted playing distance: <span className="font-semibold">{adjustedDistance.toFixed(1)} yd</span>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Recommendation</h3>
        {!best ? (
          <p className="mt-2 text-sm text-slate-600">
            Add club shots in the Clubs tab to unlock personalized recommendations.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
              <p className="text-sm text-slate-700">Primary club</p>
              <p className="text-xl font-bold text-emerald-800">{best.club}</p>
              <p className="text-sm text-slate-700">
                Avg {best.average.toFixed(1)} yd · gap {best.gap.toFixed(1)} yd · {best.samples} samples
              </p>
            </div>

            {backup && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm text-slate-700">Backup club</p>
                <p className="text-lg font-bold text-slate-900">{backup.club}</p>
                <p className="text-sm text-slate-700">
                  Avg {backup.average.toFixed(1)} yd · gap {backup.gap.toFixed(1)} yd
                </p>
              </div>
            )}

            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Typical miss tendency with {best.club}: <span className="font-semibold">{bias}</span>
            </p>
          </div>
        )}
      </article>
    </section>
  );
}
