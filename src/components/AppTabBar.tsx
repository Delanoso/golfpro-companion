export type AppTab = "dashboard" | "rounds" | "clubs" | "strategy" | "betting" | "league";

type AppTabBarProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: "dashboard", label: "Analytics" },
  { id: "rounds", label: "Rounds" },
  { id: "clubs", label: "Clubs" },
  { id: "strategy", label: "Caddy" },
  { id: "betting", label: "Betting" },
  { id: "league", label: "League" },
];

export function AppTabBar({ activeTab, onChange }: AppTabBarProps) {
  return (
    <nav className="sticky top-0 z-20 -mx-4 overflow-x-auto border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
