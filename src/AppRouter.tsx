import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import { AuthConfigRequiredPage } from "./features/auth/AuthConfigRequiredPage";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { ensurePlayerProfile } from "./services/playerProfileService";

export function AppRouter() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
