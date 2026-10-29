import { useEffect, useRef, useState } from "react";
import { clubOptions } from "../../data/defaultData";
import type { ClubName, ClubShot, DistanceUnit } from "../../types/app";
import { getClubDistanceStats } from "../../utils/analytics";
import { formatClubDisplayName } from "../../utils/clubs";
import { createId, todayIsoDate } from "../../utils/helpers";
import {
  displayDistanceToYards,
  distanceUnitLabel,
  formatDistanceFromYards,
  yardsToDisplayDistance,
} from "../../utils/units";

type ClubDistanceTrackerProps = {
  distanceUnit: DistanceUnit;
  clubShots: ClubShot[];
  selectedClubs: ClubName[];
  onAddShot: (shot: ClubShot) => void;
  onChangeSelectedClubs: (clubs: ClubName[]) => void;
  onDeleteShot: (id: string) => void;
};

export function ClubDistanceTracker({
  distanceUnit,
  clubShots,
  selectedClubs,
  onAddShot,
  onChangeSelectedClubs,
  onDeleteShot,
}: ClubDistanceTrackerProps) {
  const [isClubSettingsOpen, setIsClubSettingsOpen] = useState(true);
  const [date, setDate] = useState(todayIsoDate());
  const [club, setClub] = useState<ClubName | "">("");
  const [distanceInput, setDistanceInput] = useState<number | "">("");
  const [shotShape, setShotShape] = useState<ClubShot["shotShape"] | "">("");
  const previousUnit = useRef<DistanceUnit>(distanceUnit);
  const selectedClubSet = new Set(selectedClubs);
  const clubsForTracking = clubOptions.filter((clubOption) => selectedClubSet.has(clubOption));

  const stats = getClubDistanceStats(clubShots);

  useEffect(() => {
    if (previousUnit.current === distanceUnit) return;
    if (distanceInput === "") {
      previousUnit.current = distanceUnit;
      return;
    }
    const valueInYards = displayDistanceToYards(distanceInput, previousUnit.current);
    setDistanceInput(yardsToDisplayDistance(valueInYards, distanceUnit));
    previousUnit.current = distanceUnit;
  }, [distanceInput, distanceUnit]);

  useEffect(() => {
    if (club !== "" && !selectedClubs.includes(club)) {
      setClub("");
    }
  }, [club, selectedClubs]);

  const validationError =
    clubsForTracking.length === 0
      ? "Select at least one club in Build Your Bag."
      : club === "" || shotShape === "" || distanceInput === ""
      ? "Select club, distance, and shot pattern."
      : null;

  const setAllClubs = () => {
    onChangeSelectedClubs(clubOptions);
  };

  const clearAllClubs = () => {
    onChangeSelectedClubs([]);
  };

  const toggleClub = (clubName: ClubName) => {
    if (selectedClubSet.has(clubName)) {
      onChangeSelectedClubs(selectedClubs.filter((clubOption) => clubOption !== clubName));
      return;
    }
    onChangeSelectedClubs([...selectedClubs, clubName]);
  };

  const submitShot = (event: React.FormEvent) => {
    event.preventDefault();
    if (validationError) return;
    if (club === "" || shotShape === "" || distanceInput === "") return;
    onAddShot({
      id: createId(),
      date,
      club,
      distanceYards: displayDistanceToYards(distanceInput, distanceUnit),
      shotShape,
    });
    setClub("");
    setDistanceInput("");
    setShotShape("");
  };

  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Club Settings</h3>
            <p className="mt-1 text-sm text-slate-600">
              Build your bag. Only selected clubs appear in the Club dropdown.
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Selected: {selectedClubs.length} / {clubOptions.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsClubSettingsOpen((current) => !current)}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
            aria-expanded={isClubSettingsOpen}
          >
            {isClubSettingsOpen ? "Collapse" : "Expand"}
          </button>
        </div>

        {isClubSettingsOpen && (
          <>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={setAllClubs}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAllClubs}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {clubOptions.map((clubOption) => (
                <label
                  key={clubOption}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedClubSet.has(clubOption)}
                    onChange={() => toggleClub(clubOption)}
                  />
                  <span className="text-slate-700">{formatClubDisplayName(clubOption)}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </article>

      <form onSubmit={submitShot} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Club Distance Tracking</h3>

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
            <span className="text-slate-600">Club</span>
            <select
              value={club}
              onChange={(event) => setClub(event.target.value as ClubName | "")}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Select club</option>
              {clubsForTracking.map((clubOption) => (
                <option key={clubOption} value={clubOption}>
                  {formatClubDisplayName(clubOption)}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Carry / Total ({distanceUnitLabel(distanceUnit)})</span>
            <input
              type="number"
              min={1}
              max={450}
              value={distanceInput}
              onChange={(event) =>
                setDistanceInput(event.target.value === "" ? "" : Number(event.target.value))
              }
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="min-w-0 text-sm">
            <span className="text-slate-600">Shot Pattern</span>
            <select
              value={shotShape}
              onChange={(event) =>
                setShotShape(event.target.value as ClubShot["shotShape"] | "")
              }
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Select pattern</option>
              <option value="straight">Straight</option>
              <option value="draw">Draw</option>
              <option value="fade">Fade</option>
              <option value="miss-left">Miss Left</option>
              <option value="miss-right">Miss Right</option>
            </select>
          </label>
        </div>

        {validationError && <p className="mt-3 text-sm text-rose-600">{validationError}</p>}

        <button
          type="submit"
          disabled={clubsForTracking.length === 0}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Add shot
        </button>
      </form>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Distance Stats by Club</h3>
        {stats.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Add shot data to unlock min/max/average distance stats.
          </p>
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
                    <td className="py-2 pr-3 font-semibold">{formatClubDisplayName(item.club)}</td>
                    <td className="py-2 pr-3">{formatDistanceFromYards(item.average, distanceUnit, 1)}</td>
                    <td className="py-2 pr-3">{formatDistanceFromYards(item.min, distanceUnit, 0)}</td>
                    <td className="py-2 pr-3">{formatDistanceFromYards(item.max, distanceUnit, 0)}</td>
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
                      {formatClubDisplayName(shot.club)} -{" "}
                      {formatDistanceFromYards(shot.distanceYards, distanceUnit, 1)}
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
