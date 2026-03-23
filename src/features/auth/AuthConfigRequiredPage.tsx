export function AuthConfigRequiredPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-6">
      <section className="w-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Supabase config required</h1>
        <p className="mt-2 text-sm text-slate-600">
          Login/registration are enabled, but environment variables are missing.
        </p>
        <pre className="mt-3 rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
          VITE_SUPABASE_URL=...
          {"\n"}VITE_SUPABASE_ANON_KEY=...
        </pre>
        <p className="mt-3 text-xs text-slate-500">
          Add these values to your `.env` file and restart the server.
        </p>
      </section>
    </main>
  );
}
