import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Terms of Use</h1>
        <p className="mt-2 text-sm text-slate-700">
          GolfPro Companion provides golf tracking tools for personal use. Data and recommendations are informational,
          not professional coaching or medical advice.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>You are responsible for your own scores, wagers, and local rule compliance.</li>
          <li>Use betting features only where legal and appropriate.</li>
          <li>We may update the app and these terms over time.</li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
        <p className="mt-4 text-sm">
          <Link to="/login" className="font-semibold text-emerald-700">
            Back to app
          </Link>
        </p>
      </section>
    </main>
  );
}
