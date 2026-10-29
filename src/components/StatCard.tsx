import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
  subtext?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, tone = "default", subtext, icon }: StatCardProps) {
  const toneClass =
    tone === "success"
      ? "ring-emerald-200 bg-emerald-50"
      : tone === "warning"
        ? "ring-amber-200 bg-amber-50"
        : "ring-slate-200 bg-white";

  return (
    <article className={`rounded-2xl p-4 ring-1 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-600">{subtext}</p>}
    </article>
  );
}
