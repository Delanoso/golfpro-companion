export type AppTab = "dashboard" | "rounds" | "clubs" | "strategy" | "games" | "league";

type AppTabBarProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  title?: string;
};

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: "dashboard", label: "Analytics" },
  { id: "rounds", label: "Rounds" },
  { id: "clubs", label: "Clubs" },
  { id: "strategy", label: "Caddy" },
  { id: "games", label: "Betting" },
  { id: "league", label: "League" },
];

export function AppTabBar({ activeTab, onChange, title }: AppTabBarProps) {
  return (
    <nav className="sticky top-0 z-20 -mx-4 overflow-x-auto border-b border-slate-200 bg-gradient-to-r from-white/95 via-emerald-50/80 to-sky-50/80 px-4 py-3 backdrop-blur">
      {title && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`w-full rounded-full px-2 py-2 text-center text-xs font-semibold transition sm:w-auto sm:px-4 sm:text-sm ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                : "bg-white/90 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
