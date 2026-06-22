import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatAuthError } from "../../lib/authErrors";
import { supabase } from "../../lib/supabase";
import { ensurePlayerProfile } from "../../services/playerProfileService";

export function RegisterPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) {
        setError(formatAuthError(signUpError));
        return;
      }

      if (data.user && data.session) {
        try {
          await ensurePlayerProfile(data.user);
        } catch (profileError) {
          console.warn("Unable to create player profile after registration.", profileError);
        }
        navigate("/app", { replace: true });
        return;
      }

      setSuccessMessage(
        "Registration successful. Check your email for confirmation, then log in.",
      );
    } catch (signUpError) {
      setError(formatAuthError(signUpError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-6">
      <section className="w-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Register as a player and save your own analytics profile.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-600">Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>

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

          <label className="block text-sm">
            <span className="text-slate-600">Password</span>
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

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {successMessage && <p className="text-sm text-emerald-700">{successMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-emerald-700">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
