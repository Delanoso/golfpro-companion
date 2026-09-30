import { useEffect, useMemo, useRef, useState } from "react";
import {
  ERPM_COURSE_NAME,
  ERPM_GUIDE,
  type ErpmTee,
  getErpmHoleGuide,
  isErpmCourseName,
} from "../../data/courseGuides";
import type { ClubShot, DistanceUnit } from "../../types/app";
import { getClubDistanceStats } from "../../utils/analytics";
import { formatClubDisplayName } from "../../utils/clubs";
import {
  displayDistanceToYards,
  distanceUnitLabel,
  yardsToDisplayDistance,
} from "../../utils/units";

type SmartCaddyProps = {
  distanceUnit: DistanceUnit;
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

export function SmartCaddy({ distanceUnit, clubShots }: SmartCaddyProps) {
  const [course, setCourse] = useState("");
  const [tee, setTee] = useState<ErpmTee | "">("");
  const [hole, setHole] = useState<number | "">("");
  const [targetDistance, setTargetDistance] = useState<number | "">("");
  const [windAdjustment, setWindAdjustment] = useState<number | "">("");
  const [elevationAdjustment, setElevationAdjustment] = useState<number | "">("");
  const [temperatureAdjustment, setTemperatureAdjustment] = useState<number | "">("");
  const previousUnit = useRef<DistanceUnit>(distanceUnit);

  useEffect(() => {
    if (previousUnit.current === distanceUnit) return;
    const convert = (value: number | "") =>
      value === ""
        ? ""
        : yardsToDisplayDistance(displayDistanceToYards(value, previousUnit.current), distanceUnit);
    setTargetDistance((current) => convert(current));
    setWindAdjustment((current) => convert(current));
    setElevationAdjustment((current) => convert(current));
    setTemperatureAdjustment((current) => convert(current));
    previousUnit.current = distanceUnit;
  }, [distanceUnit]);

  useEffect(() => {
    if (isErpmCourseName(course)) return;
    setTee("");
    setHole("");
  }, [course]);

  const selectedHoleGuide = useMemo(() => {
    if (!isErpmCourseName(course) || hole === "") return undefined;
    return getErpmHoleGuide(hole);
  }, [course, hole]);

  const selectedTee: ErpmTee = tee === "yellow" || tee === "white" ? tee : "white";

  const targetValue = targetDistance === "" ? 0 : targetDistance;
  const windValue = windAdjustment === "" ? 0 : windAdjustment;
  const elevationValue = elevationAdjustment === "" ? 0 : elevationAdjustment;
  const temperatureValue = temperatureAdjustment === "" ? 0 : temperatureAdjustment;
  const adjustedDistanceDisplay = targetValue + windValue + elevationValue + temperatureValue;
  const hasTargetInput = targetDistance !== "";
  const adjustedDistanceYards = displayDistanceToYards(adjustedDistanceDisplay, distanceUnit);

  const recommendations = useMemo<Recommendation[]>(() => {
    return getClubDistanceStats(clubShots)
      .map((club) => ({
        club: club.club,
        average: club.average,
        samples: club.samples,
        gap: Math.abs(club.average - adjustedDistanceYards),
      }))
      .sort((a, b) => a.gap - b.gap);
  }, [adjustedDistanceYards, clubShots]);

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
        <h3 className="text-base font-semibold text-slate-900">Course Strategy Guide</h3>
        <p className="mt-1 text-sm text-slate-600">
          Select a course and hole to load hazard-aware strategy notes.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Course</span>
            <input
              list="caddy-course-options"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              placeholder="Course name"
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
            <datalist id="caddy-course-options">
              <option value={ERPM_COURSE_NAME} />
              <option value="ERPM" />
            </datalist>
          </label>

          {isErpmCourseName(course) && (
            <>
              <label className="min-w-0 text-sm">
                <span className="text-slate-600">ERPM tee</span>
                <select
                  value={tee}
                  onChange={(event) => setTee(event.target.value as ErpmTee | "")}
                  className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Select tee</option>
                  <option value="yellow">Yellow (Championship)</option>
                  <option value="white">White (Club)</option>
                </select>
              </label>
              <label className="min-w-0 text-sm">
                <span className="text-slate-600">Hole</span>
                <select
                  value={hole}
                  onChange={(event) =>
                    setHole(event.target.value === "" ? "" : Number(event.target.value))
                  }
                  className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Select hole</option>
                  {ERPM_GUIDE.holes.map((item) => (
                    <option key={item.holeNumber} value={item.holeNumber}>
                      Hole {item.holeNumber}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>

        {isErpmCourseName(course) && (
          <p className="mt-2 text-xs text-slate-600">
            ERPM ratings/slope: Yellow {ERPM_GUIDE.profile.ratingsByTee.yellow.rating}/
            {ERPM_GUIDE.profile.ratingsByTee.yellow.slope} · White{" "}
            {ERPM_GUIDE.profile.ratingsByTee.white.rating}/{ERPM_GUIDE.profile.ratingsByTee.white.slope}
          </p>
        )}

        {selectedHoleGuide && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
            <p className="text-sm font-semibold text-emerald-900">
              Hole {selectedHoleGuide.holeNumber} · Par {selectedHoleGuide.par} · SI{" "}
              {selectedHoleGuide.strokeIndex}
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              Distance ({selectedTee === "yellow" ? "Yellow" : "White"}):{" "}
              {selectedHoleGuide.distanceMeters[selectedTee]} m
            </p>
            <p className="mt-2 text-xs text-emerald-900/90">
              <span className="font-semibold">Hazards:</span> {selectedHoleGuide.hazards}
            </p>
            <p className="mt-1 text-xs text-emerald-900/90">
              <span className="font-semibold">Plan:</span> {selectedHoleGuide.strategy}
            </p>
            <button
              type="button"
              onClick={() =>
                setTargetDistance(
                  Number(
                    yardsToDisplayDistance(
                      displayDistanceToYards(selectedHoleGuide.distanceMeters[selectedTee], "meters"),
                      distanceUnit,
                    ).toFixed(1),
                  ),
                )
              }
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Use hole distance as target
            </button>
          </div>
        )}
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Smart "Caddy" Strategy</h3>
        <p className="mt-1 text-sm text-slate-600">
          Recommends clubs using your own historical distances, not tour-average numbers.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">
              Target distance ({distanceUnitLabel(distanceUnit)})
            </span>
            <input
              type="number"
              value={targetDistance}
              onChange={(event) =>
                setTargetDistance(event.target.value === "" ? "" : Number(event.target.value))
              }
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Wind adjust ({distanceUnitLabel(distanceUnit)})</span>
            <input
              type="number"
              value={windAdjustment}
              onChange={(event) =>
                setWindAdjustment(event.target.value === "" ? "" : Number(event.target.value))
              }
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">
              Elevation adjust ({distanceUnitLabel(distanceUnit)})
            </span>
            <input
              type="number"
              value={elevationAdjustment}
              onChange={(event) =>
                setElevationAdjustment(event.target.value === "" ? "" : Number(event.target.value))
              }
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="min-w-0 text-sm">
            <span className="text-slate-600">
              Temperature adjust ({distanceUnitLabel(distanceUnit)})
            </span>
            <input
              type="number"
              value={temperatureAdjustment}
              onChange={(event) =>
                setTemperatureAdjustment(event.target.value === "" ? "" : Number(event.target.value))
              }
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          Adjusted playing distance:{" "}
          <span className="font-semibold">
            {hasTargetInput
              ? `${adjustedDistanceDisplay.toFixed(1)} ${distanceUnitLabel(distanceUnit)}`
              : "--"}
          </span>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Recommendation</h3>
        {!hasTargetInput ? (
          <p className="mt-2 text-sm text-slate-600">Enter target distance to get a recommendation.</p>
        ) : !best ? (
          <p className="mt-2 text-sm text-slate-600">
            Add club shots in the Clubs tab to unlock personalized recommendations.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
              <p className="text-sm text-slate-700">Primary club</p>
              <p className="text-xl font-bold text-emerald-800">{formatClubDisplayName(best.club)}</p>
              <p className="text-sm text-slate-700">
                Avg {yardsToDisplayDistance(best.average, distanceUnit).toFixed(1)}{" "}
                {distanceUnitLabel(distanceUnit)} · gap{" "}
                {yardsToDisplayDistance(best.gap, distanceUnit).toFixed(1)}{" "}
                {distanceUnitLabel(distanceUnit)} · {best.samples} samples
              </p>
            </div>

            {backup && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm text-slate-700">Backup club</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatClubDisplayName(backup.club)}
                </p>
                <p className="text-sm text-slate-700">
                  Avg {yardsToDisplayDistance(backup.average, distanceUnit).toFixed(1)}{" "}
                  {distanceUnitLabel(distanceUnit)} · gap{" "}
                  {yardsToDisplayDistance(backup.gap, distanceUnit).toFixed(1)}{" "}
                  {distanceUnitLabel(distanceUnit)}
                </p>
              </div>
            )}

            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Typical miss tendency with {formatClubDisplayName(best.club)}:{" "}
              <span className="font-semibold">{bias}</span>
            </p>
          </div>
        )}
      </article>
    </section>
  );
}
