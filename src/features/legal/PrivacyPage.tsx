import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-700">
          GolfPro Companion stores your golf records so you can track performance across your devices.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Account credentials are handled by Supabase Auth.</li>
          <li>Round, club, and betting data are stored in your account&apos;s private data record.</li>
          <li>Shared league data is visible to members of each league.</li>
          <li>Public profile data is visible only if you explicitly enable sharing in Account Settings.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          You can clear your in-app data using the reset option. For account removal, contact the app owner.
        </p>
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
