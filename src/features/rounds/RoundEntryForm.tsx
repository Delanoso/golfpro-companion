import { useMemo, useState } from "react";
import type { RoundEntry, WedgeShot } from "../../types/app";
import { clamp, createId, todayIsoDate } from "../../utils/helpers";

type RoundEntryFormProps = {
  rounds: RoundEntry[];
  onAddRound: (round: RoundEntry) => void;
  onDeleteRound: (id: string) => void;
};

export function RoundEntryForm({ rounds, onAddRound, onDeleteRound }: RoundEntryFormProps) {
  const [date, setDate] = useState(todayIsoDate());
  const [course, setCourse] = useState("Sunward Park");
  const [holes, setHoles] = useState<9 | 18>(18);
  const [par, setPar] = useState(72);
  const [totalScore, setTotalScore] = useState(88);
  const [putts, setPutts] = useState(34);
  const [onePutts, setOnePutts] = useState(5);
  const [threePutts, setThreePutts] = useState(2);
  const [notes, setNotes] = useState("");

  const [wedgeDistance, setWedgeDistance] = useState(80);
  const [wedgeProximity, setWedgeProximity] = useState(22);
  const [wedgeShots, setWedgeShots] = useState<WedgeShot[]>([]);

  const validationError = useMemo(() => {
    if (onePutts + threePutts > holes) return "1-putts + 3-putts cannot exceed total holes.";
    if (putts < onePutts + threePutts) return "Total putts cannot be less than 1-putts + 3-putts.";
    return null;
  }, [holes, onePutts, putts, threePutts]);

  const addWedgeShot = () => {
    setWedgeShots((current) => [
      ...current,
      {
        id: createId(),
        distanceYards: clamp(wedgeDistance, 1, 220),
        proximityFeet: clamp(wedgeProximity, 0, 200),
      },
    ]);
  };

  const submitRound = (event: React.FormEvent) => {
    event.preventDefault();
    if (validationError) return;

    onAddRound({
      id: createId(),
      date,
      course,
      holes,
      par,
      totalScore,
      putts,
      onePutts,
      threePutts,
      wedgeShots,
      notes: notes.trim() || undefined,
    });

    setNotes("");
    setWedgeShots([]);
  };

  return (
    <section className="space-y-4">
      <form onSubmit={submitRound} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Round Entry</h3>

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
              placeholder="Course name"
            />
          </label>

          <label className="text-sm">
            <span className="text-slate-600">Holes</span>
            <select
              value={holes}
              onChange={(event) => setHoles(Number(event.target.value) as 9 | 18)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value={9}>9</option>
              <option value={18}>18</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Par</span>
            <input
              type="number"
              value={par}
              min={27}
              max={90}
              onChange={(event) => setPar(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="text-slate-600">Total Score</span>
            <input
              type="number"
              value={totalScore}
              min={20}
              max={200}
              onChange={(event) => setTotalScore(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">Total Putts</span>
            <input
              type="number"
              value={putts}
              min={0}
              max={100}
              onChange={(event) => setPutts(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="text-slate-600">1-Putt Holes</span>
            <input
              type="number"
              value={onePutts}
              min={0}
              max={holes}
              onChange={(event) => setOnePutts(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">3-Putt Holes</span>
            <input
              type="number"
              value={threePutts}
              min={0}
              max={holes}
              onChange={(event) => setThreePutts(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
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
          <p className="text-sm font-semibold text-slate-800">Wedge Shot Log (for analytics)</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              value={wedgeDistance}
              onChange={(event) => setWedgeDistance(Number(event.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Distance (yd)"
            />
            <input
              type="number"
              min={0}
              value={wedgeProximity}
              onChange={(event) => setWedgeProximity(Number(event.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Leave (ft)"
            />
          </div>
          <button
            type="button"
            onClick={addWedgeShot}
            className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Add wedge shot
          </button>

          {wedgeShots.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {wedgeShots.map((shot) => (
                <li key={shot.id}>
                  {shot.distanceYards} yd -> {shot.proximityFeet} ft
                </li>
              ))}
            </ul>
          )}
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
                      {round.date} · {round.holes} holes · {round.putts} putts
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
