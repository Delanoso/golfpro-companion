import type { Hole } from "../types/golf";

type HoleSelectorProps = {
  holes: Hole[];
  selectedHoleId: number;
  onSelectHole: (holeId: number) => void;
};

export function HoleSelector({ holes, selectedHoleId, onSelectHole }: HoleSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {holes.map((hole) => {
        const selected = hole.id === selectedHoleId;

        return (
          <button
            key={hole.id}
            type="button"
            onClick={() => onSelectHole(hole.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              selected
                ? "bg-emerald-600 text-white shadow"
                : "bg-white text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            {hole.name}
          </button>
        );
      })}
    </div>
  );
}
