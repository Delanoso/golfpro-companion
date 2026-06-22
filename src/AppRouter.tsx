import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import { AuthConfigRequiredPage } from "./features/auth/AuthConfigRequiredPage";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { formatAuthError } from "./lib/authErrors";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { ensurePlayerProfile } from "./services/playerProfileService";

export function AppRouter() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoadError, setAuthLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthLoadError(formatAuthError(error));
        }
        setSession(data.session);
      })
      .catch((error) => {
        if (!active) return;
        setAuthLoadError(formatAuthError(error));
        setSession(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthLoadError(null);
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    ensurePlayerProfile(session.user).catch(() => {
      // Non-blocking; auth still proceeds even if profile write fails.
    });
  }, [session?.user]);

  if (!isSupabaseConfigured) {
    return <AuthConfigRequiredPage />;
  }

  if (loading) {
    return <div className="p-5 text-sm text-slate-600">Loading authentication...</div>;
  }

  if (authLoadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-6">
        <section className="w-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Authentication unavailable</h1>
          <p className="mt-2 text-sm text-rose-700">{authLoadError}</p>
        </section>
      </main>
    );
  }

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/app" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={session ? <Navigate to="/app" replace /> : <RegisterPage />}
      />
      <Route
        path="/app"
        element={
          session?.user ? (
            <App currentUser={session.user} onSignOut={signOut} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={session?.user ? "/app" : "/login"} replace />}
      />
    </Routes>
  );
}
