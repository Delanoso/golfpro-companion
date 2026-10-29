import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [canSetPassword, setCanSetPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setCanSetPassword(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setCanSetPassword(true);
      } else if (session) {
        setCanSetPassword(true);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setStatus("Password reset email sent. Use the link in your inbox.");
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    if (password.length < 8) {
      setBusy(false);
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setBusy(false);
      setError("Passwords do not match.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setStatus("Password updated successfully. You can return to the app.");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-6">
      <section className="w-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
        {!canSetPassword ? (
          <form onSubmit={requestReset} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-slate-600">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Sending..." : "Send reset email"}
            </button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-slate-600">New password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {status && <p className="mt-3 text-sm text-emerald-700">{status}</p>}

        <p className="mt-4 text-sm text-slate-600">
          <Link to="/login" className="font-semibold text-emerald-700">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
