import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import { AuthConfigRequiredPage } from "./features/auth/AuthConfigRequiredPage";
import { LoginPage } from "./features/auth/LoginPage";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { PrivacyPage } from "./features/legal/PrivacyPage";
import { TermsPage } from "./features/legal/TermsPage";
import { JoinLeaguePage } from "./features/league/JoinLeaguePage";
import { PublicProfilePage } from "./features/profile/PublicProfilePage";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { ensurePlayerProfile } from "./services/playerProfileService";

export function AppRouter() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthError(error.message);
        } else {
          setSession(data.session);
        }
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error instanceof Error ? error.message : "Unable to load authentication.");
      })
      .finally(() => {
        if (!active) return;
        setAuthChecked(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthChecked(true);
      setAuthError(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    ensurePlayerProfile(session.user).catch(() => {
      // Non-blocking: user can still continue even if profile write fails.
    });
  }, [session?.user]);

  if (!isSupabaseConfigured) {
    return <AuthConfigRequiredPage />;
  }

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <>
      {!authChecked && (
        <div className="bg-slate-100 px-4 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
          Checking authentication...
        </div>
      )}
      {authError && (
        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          {authError}
        </div>
      )}
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/app" replace /> : <LoginPage />} />
        <Route path="/register" element={session ? <Navigate to="/app" replace /> : <RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/share/:shareCode" element={<PublicProfilePage />} />
        <Route
          path="/join/:inviteCode"
          element={
            session?.user ? (
              <JoinLeaguePage currentUser={session.user} />
            ) : (
              <Navigate to={`/login?next=${encodeURIComponent(window.location.pathname)}`} replace />
            )
          }
        />
        <Route
          path="/app"
          element={session?.user ? <App currentUser={session.user} onSignOut={signOut} /> : <Navigate to="/login" replace />}
        />
        <Route path="/" element={<Navigate to={session?.user ? "/app" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={session?.user ? "/app" : "/login"} replace />} />
      </Routes>
    </>
  );
}
