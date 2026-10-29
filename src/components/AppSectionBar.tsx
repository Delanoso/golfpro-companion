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
            ? "bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-sm"
            : "bg-white/90 text-slate-700 ring-1 ring-slate-200"
        }`}
      >
        Golf Strategy
      </button>
    </nav>
  );
}
