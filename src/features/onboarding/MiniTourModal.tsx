import { useState } from "react";

type MiniTourModalProps = {
  onDone: () => void;
};

const steps = [
  {
    title: "Rounds first",
    body: "Use Rounds quick mode while playing. Every hole auto-saves so your card stays safe if you lock your phone.",
  },
  {
    title: "Clubs + Caddy",
    body: "Log a few shots in Clubs, then Caddy will recommend clubs from your own distances instead of generic numbers.",
  },
  {
    title: "Leagues + Betting",
    body: "Create league invites and save betting results with settlement so everyone can track scores and payouts.",
  },
];

export function MiniTourModal({ onDone }: MiniTourModalProps) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Quick tour ({index + 1}/{steps.length})
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h2>
        <p className="mt-3 text-sm text-slate-700">{step.body}</p>

        <div className="mt-5 flex justify-between">
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Skip
          </button>
          {!isLast ? (
            <button
              type="button"
              onClick={() => setIndex((current) => Math.min(current + 1, steps.length - 1))}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Start using app
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
