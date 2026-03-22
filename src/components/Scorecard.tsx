import { useEffect, useMemo, useState } from "react";
import type { Hole, ScorecardEntry } from "../types/golf";
import { formatRelativeToPar } from "../utils/distance";

type ScorecardProps = {
  holes: Hole[];
};

const makeInitialEntries = (holes: Hole[]): ScorecardEntry[] =>
  holes.map((hole) => ({
    hole: hole.id,
    par: hole.par,
    strokes: hole.par,
    putts: 2,
  }));

export function Scorecard({ holes }: ScorecardProps) {
  const [mode, setMode] = useState<9 | 18>(18);
  const [entries, setEntries] = useState<ScorecardEntry[]>(() => makeInitialEntries(holes));

  useEffect(() => {
    setEntries(makeInitialEntries(holes));
  }, [holes]);

  const visibleEntries = useMemo(() => {
    if (mode === 18) return entries;
    return entries.slice(0, 9);
  }, [entries, mode]);

  const totals = useMemo(() => {
    return visibleEntries.reduce(
      (accumulator, entry) => ({
        par: accumulator.par + entry.par,
        strokes: accumulator.strokes + entry.strokes,
        putts: accumulator.putts + entry.putts,
      }),
      { par: 0, strokes: 0, putts: 0 },
    );
  }, [visibleEntries]);

  const scoreToPar = totals.strokes - totals.par;

  const onFieldUpdate = (holeNumber: number, field: "strokes" | "putts", value: number) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.hole === holeNumber
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
        {[9, 18].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option as 9 | 18)}
            className={`w-full rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === option ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"
            }`}
          >
            {option} holes
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Hole</th>
              <th className="px-3 py-2 text-left">Par</th>
              <th className="px-3 py-2 text-left">Strokes</th>
              <th className="px-3 py-2 text-left">Putts</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map((entry) => (
              <tr key={entry.hole} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">{entry.hole}</td>
                <td className="px-3 py-2">{entry.par}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={entry.strokes}
                    onChange={(event) => onFieldUpdate(entry.hole, "strokes", Number(event.target.value))}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={entry.putts}
                    onChange={(event) => onFieldUpdate(entry.hole, "putts", Number(event.target.value))}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Par</p>
          <p className="text-lg font-bold">{totals.par}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Strokes</p>
          <p className="text-lg font-bold">{totals.strokes}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">vs Par</p>
          <p className="text-lg font-bold">{formatRelativeToPar(scoreToPar)}</p>
        </div>
      </div>
    </div>
  );
}
