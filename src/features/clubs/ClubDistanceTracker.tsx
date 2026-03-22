import { useState } from "react";
import { clubOptions } from "../../data/defaultData";
import type { ClubName, ClubShot } from "../../types/app";
import { getClubDistanceStats } from "../../utils/analytics";
import { createId, todayIsoDate } from "../../utils/helpers";

type ClubDistanceTrackerProps = {
  clubShots: ClubShot[];
  onAddShot: (shot: ClubShot) => void;
  onDeleteShot: (id: string) => void;
};

export function ClubDistanceTracker({
  clubShots,
  onAddShot,
  onDeleteShot,
}: ClubDistanceTrackerProps) {
  const [date, setDate] = useState(todayIsoDate());
  const [club, setClub] = useState<ClubName>("7I");
  const [distanceYards, setDistanceYards] = useState(150);
  const [shotShape, setShotShape] = useState<ClubShot["shotShape"]>("straight");

  const stats = getClubDistanceStats(clubShots);

  const submitShot = (event: React.FormEvent) => {
    event.preventDefault();
    onAddShot({
      id: createId(),
      date,
      club,
      distanceYards,
      shotShape,
    });
  };

  return (
    <section className="space-y-4">
      <form onSubmit={submitShot} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Club Distance Tracking</h3>

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
            <span className="text-slate-600">Club</span>
            <select
              value={club}
              onChange={(event) => setClub(event.target.value as ClubName)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {clubOptions.map((clubOption) => (
                <option key={clubOption} value={clubOption}>
                  {clubOption}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="text-slate-600">Carry / Total (yd)</span>
            <input
              type="number"
              min={1}
              max={450}
              value={distanceYards}
              onChange={(event) => setDistanceYards(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="text-slate-600">Shot Pattern</span>
            <select
              value={shotShape}
              onChange={(event) => setShotShape(event.target.value as ClubShot["shotShape"])}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="straight">Straight</option>
              <option value="draw">Draw</option>
              <option value="fade">Fade</option>
              <option value="miss-left">Miss Left</option>
              <option value="miss-right">Miss Right</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Add shot
        </button>
      </form>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Distance Stats by Club</h3>
        {stats.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Add shot data to unlock min/max/average yardages.</p>
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
                {stats.map((item) => (
                  <tr key={item.club} className="border-t border-slate-100 text-slate-700">
                    <td className="py-2 pr-3 font-semibold">{item.club}</td>
                    <td className="py-2 pr-3">{item.average.toFixed(1)} yd</td>
                    <td className="py-2 pr-3">{item.min.toFixed(0)} yd</td>
                    <td className="py-2 pr-3">{item.max.toFixed(0)} yd</td>
                    <td className="py-2 pr-3">{item.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Recent Club Shots</h3>
        {clubShots.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No shots saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {clubShots
              .slice()
              .reverse()
              .map((shot) => (
                <li
                  key={shot.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">
                      {shot.club} - {shot.distanceYards} yd
                    </p>
                    <p className="text-xs text-slate-500">
                      {shot.date} · {shot.shotShape}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteShot(shot.id)}
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
