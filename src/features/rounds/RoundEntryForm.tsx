import { useEffect, useMemo, useRef, useState } from "react";
import type { DistanceUnit, HoleCount, HoleScore, RoundEntry, WedgeShot } from "../../types/app";
import { clamp, createId, todayIsoDate } from "../../utils/helpers";
import {
  displayDistanceToYards,
  distanceUnitLabel,
  yardsToDisplayDistance,
} from "../../utils/units";

type RoundEntryFormProps = {
  distanceUnit: DistanceUnit;
  rounds: RoundEntry[];
  onAddRound: (round: RoundEntry) => void;
  onDeleteRound: (id: string) => void;
};

type HoleScoreDraft = {
  holeNumber: number;
  par: number | "";
  strokes: number | "";
  putts: number | "";
  wedgeDistance: number | "";
  wedgeMiss: WedgeShot["miss"] | "";
};

function createHoleDraft(holeNumber: number): HoleScoreDraft {
  return {
    holeNumber,
    par: "",
    strokes: "",
    putts: "",
    wedgeDistance: "",
    wedgeMiss: "",
  };
}

function ensureHoleDrafts(count: HoleCount | "", existing: HoleScoreDraft[]): HoleScoreDraft[] {
  if (count === "") return [];
  const next: HoleScoreDraft[] = [];
  for (let hole = 1; hole <= count; hole += 1) {
    const previous = existing.find((item) => item.holeNumber === hole);
    next.push(previous ?? createHoleDraft(hole));
  }
  return next;
}

export function RoundEntryForm({
  distanceUnit,
  rounds,
  onAddRound,
  onDeleteRound,
}: RoundEntryFormProps) {
  const [date, setDate] = useState(todayIsoDate());
  const [course, setCourse] = useState("");
  const [holes, setHoles] = useState<HoleCount | "">("");
  const [notes, setNotes] = useState("");
  const [holeDrafts, setHoleDrafts] = useState<HoleScoreDraft[]>([]);
  const previousUnit = useRef<DistanceUnit>(distanceUnit);

  useEffect(() => {
    setHoleDrafts((current) => ensureHoleDrafts(holes, current));
  }, [holes]);

  useEffect(() => {
    if (previousUnit.current === distanceUnit) return;
    setHoleDrafts((current) =>
      current.map((draft) => {
        if (draft.wedgeDistance === "") return draft;
        const yards = displayDistanceToYards(draft.wedgeDistance, previousUnit.current);
        return {
          ...draft,
          wedgeDistance: yardsToDisplayDistance(yards, distanceUnit),
        };
      }),
    );
    previousUnit.current = distanceUnit;
  }, [distanceUnit]);

  const summary = useMemo(() => {
    const totalPar = holeDrafts.reduce(
      (sum, holeScore) => sum + (typeof holeScore.par === "number" ? holeScore.par : 0),
      0,
    );
    const totalScore = holeDrafts.reduce(
      (sum, holeScore) => sum + (typeof holeScore.strokes === "number" ? holeScore.strokes : 0),
      0,
    );
    const totalPutts = holeDrafts.reduce(
      (sum, holeScore) => sum + (typeof holeScore.putts === "number" ? holeScore.putts : 0),
      0,
    );
    const onePutts = holeDrafts.filter((holeScore) => holeScore.putts === 1).length;
    const threePutts = holeDrafts.filter(
      (holeScore) => typeof holeScore.putts === "number" && holeScore.putts >= 3,
    ).length;
    return { totalPar, totalScore, totalPutts, onePutts, threePutts };
  }, [holeDrafts]);

  const validationError = useMemo<string | null>(() => {
    if (!course.trim()) return "Course is required.";
    if (holes === "") return "Please select 9 or 18 holes.";

    for (const hole of holeDrafts) {
      if (hole.par === "" || hole.strokes === "" || hole.putts === "") {
        return `Hole ${hole.holeNumber}: par, strokes, and putts are required.`;
      }
      if (hole.putts > hole.strokes) {
        return `Hole ${hole.holeNumber}: putts cannot be more than strokes.`;
      }

      const hasWedgeDistance = hole.wedgeDistance !== "";
      const hasWedgeMiss = hole.wedgeMiss !== "";
      if (hasWedgeDistance !== hasWedgeMiss) {
        return `Hole ${hole.holeNumber}: add both wedge distance and wedge miss, or leave both empty.`;
      }
    }
    return null;
  }, [holeDrafts]);

  const updateHoleDraft = (
    holeNumber: number,
    field: keyof Omit<HoleScoreDraft, "holeNumber">,
    value: number | "" | WedgeShot["miss"],
  ) => {
    setHoleDrafts((current) =>
      current.map((draft) => {
        if (draft.holeNumber !== holeNumber) return draft;
        return { ...draft, [field]: value };
      }),
    );
  };

  const submitRound = (event: React.FormEvent) => {
    event.preventDefault();
    if (validationError || holes === "") return;

    const holeScores: HoleScore[] = holeDrafts.map((hole) => ({
      holeNumber: hole.holeNumber,
      par: clamp(Number(hole.par), 2, 7),
      strokes: clamp(Number(hole.strokes), 1, 20),
      putts: clamp(Number(hole.putts), 0, 10),
      wedgeDistanceYards:
        hole.wedgeDistance === ""
          ? undefined
          : clamp(displayDistanceToYards(hole.wedgeDistance, distanceUnit), 1, 220),
      wedgeMiss: hole.wedgeMiss === "" ? undefined : hole.wedgeMiss,
    }));

    const wedgeShots: WedgeShot[] = holeScores
      .filter(
        (hole) =>
          typeof hole.wedgeDistanceYards === "number" && typeof hole.wedgeMiss === "string",
      )
      .map((hole) => ({
        id: createId(),
        hole: hole.holeNumber,
        distanceYards: hole.wedgeDistanceYards as number,
        miss: hole.wedgeMiss as WedgeShot["miss"],
      }));

    onAddRound({
      id: createId(),
      date,
      course,
      holes,
      par: summary.totalPar,
      totalScore: summary.totalScore,
      putts: summary.totalPutts,
      onePutts: summary.onePutts,
      threePutts: summary.threePutts,
      holeScores,
      wedgeShots,
      notes: notes.trim() || undefined,
    });

    setNotes("");
    setCourse("");
    setHoles("");
    setHoleDrafts([]);
  };

  return (
    <section className="space-y-4">
      <form onSubmit={submitRound} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Scorecard Entry (9/18 holes)</h3>

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
              placeholder="Course name"
            />
          </label>

          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Holes</span>
            <select
              value={holes}
              onChange={(event) =>
                setHoles(event.target.value === "" ? "" : (Number(event.target.value) as HoleCount))
              }
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Select holes</option>
              <option value={9}>9</option>
              <option value={18}>18</option>
            </select>
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="text-slate-600">Round Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="What cost or saved strokes today?"
          />
        </label>

        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">
            Hole-by-hole scorecard (add putts and optional wedge shot per hole)
          </p>
          {holeDrafts.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600">Select 9 or 18 holes to begin scorecard entry.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Hole</th>
                    <th className="px-2 py-2">Par</th>
                    <th className="px-2 py-2">Strokes</th>
                    <th className="px-2 py-2">Putts</th>
                    <th className="px-2 py-2">Wedge ({distanceUnitLabel(distanceUnit)})</th>
                    <th className="px-2 py-2">Wedge miss</th>
                  </tr>
                </thead>
                <tbody>
                  {holeDrafts.map((hole) => (
                    <tr key={hole.holeNumber} className="border-t border-slate-200">
                      <td className="px-2 py-2 font-semibold text-slate-800">{hole.holeNumber}</td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={2}
                          max={7}
                          value={hole.par}
                          onChange={(event) =>
                            updateHoleDraft(
                              hole.holeNumber,
                              "par",
                              event.target.value === "" ? "" : Number(event.target.value),
                            )
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={hole.strokes}
                          onChange={(event) =>
                            updateHoleDraft(
                              hole.holeNumber,
                              "strokes",
                              event.target.value === "" ? "" : Number(event.target.value),
                            )
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={hole.putts}
                          onChange={(event) =>
                            updateHoleDraft(
                              hole.holeNumber,
                              "putts",
                              event.target.value === "" ? "" : Number(event.target.value),
                            )
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={1}
                          max={220}
                          value={hole.wedgeDistance}
                          onChange={(event) =>
                            updateHoleDraft(
                              hole.holeNumber,
                              "wedgeDistance",
                              event.target.value === "" ? "" : Number(event.target.value),
                            )
                          }
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={hole.wedgeMiss}
                          onChange={(event) =>
                            updateHoleDraft(
                              hole.holeNumber,
                              "wedgeMiss",
                              event.target.value === "" ? "" : (event.target.value as WedgeShot["miss"]),
                            )
                          }
                          className="w-32 rounded-lg border border-slate-300 px-2 py-1"
                        >
                          <option value="">-</option>
                          <option value="left">Miss left</option>
                          <option value="right">Miss right</option>
                          <option value="over">Over</option>
                          <option value="short">Short</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 sm:grid-cols-5">
            <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-slate-200">
              Total Par: <span className="font-semibold">{summary.totalPar}</span>
            </div>
            <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-slate-200">
              Score: <span className="font-semibold">{summary.totalScore}</span>
            </div>
            <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-slate-200">
              Putts: <span className="font-semibold">{summary.totalPutts}</span>
            </div>
            <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-slate-200">
              1-putts: <span className="font-semibold">{summary.onePutts}</span>
            </div>
            <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-slate-200">
              3+ putts: <span className="font-semibold">{summary.threePutts}</span>
            </div>
          </div>
        </div>

        {validationError && <p className="mt-3 text-sm text-rose-600">{validationError}</p>}

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Save round
        </button>
      </form>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Recent Rounds</h3>
        {rounds.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No rounds saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rounds
              .slice()
              .reverse()
              .map((round) => (
                <li
                  key={round.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">
                      {round.course} - {round.totalScore} ({round.totalScore - round.par >= 0 ? "+" : ""}
                      {round.totalScore - round.par})
                    </p>
                    <p className="text-xs text-slate-500">
                      {round.date} · {round.holes} holes · {round.putts} putts · {round.wedgeShots.length} wedges
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteRound(round.id)}
                    className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        )}
      </article>
    </section>
  );
}
