import type { AppSection } from "../types/app";

type AppSectionBarProps = {
  activeSection: AppSection;
  onChange: (section: AppSection) => void;
};

export function AppSectionBar({ activeSection, onChange }: AppSectionBarProps) {
  return (
    <nav className="mt-3 flex gap-2 overflow-x-auto">
      <button
        type="button"
        onClick={() => onChange("golf-strategy")}
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          activeSection === "golf-strategy"
            ? "bg-emerald-700 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        Golf Strategy
      </button>
      <button
        type="button"
        onClick={() => onChange("training")}
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          activeSection === "training"
            ? "bg-emerald-700 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        Training
      </button>
      <button
        type="button"
        onClick={() => onChange("range-finder")}
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          activeSection === "range-finder"
            ? "bg-emerald-700 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        Range Finder
      </button>
    </nav>
  );
}
