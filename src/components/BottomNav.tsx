export type AppTab = "hole" | "scorecard" | "weather";

type BottomNavProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: "hole", label: "Hole View" },
  { id: "scorecard", label: "Scorecard" },
  { id: "weather", label: "Weather" },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-3xl gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow"
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
