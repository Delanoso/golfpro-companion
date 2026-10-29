import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate, useParams } from "react-router-dom";
import { joinSharedLeagueByCode } from "../../services/leagueService";

type JoinLeaguePageProps = {
  currentUser: User;
};

const getDisplayName = (user: User) =>
  (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()) ||
  user.email?.split("@")[0] ||
  "Player";

export function JoinLeaguePage({ currentUser }: JoinLeaguePageProps) {
  const { inviteCode = "" } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Joining league...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const join = async () => {
      try {
        const league = await joinSharedLeagueByCode(inviteCode, currentUser, getDisplayName(currentUser));
        if (!active) return;
        localStorage.setItem("golfpro-last-joined-league", league.id);
        setStatus(`Joined "${league.name}". Redirecting...`);
        setTimeout(() => {
          navigate("/app", { replace: true });
        }, 700);
      } catch (joinError) {
        if (!active) return;
        setError(joinError instanceof Error ? joinError.message : "Unable to join league.");
      }
    };
    void join();
    return () => {
      active = false;
    };
  }, [currentUser, inviteCode, navigate]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-6">
      <section className="w-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">League Invite</h1>
        {error ? (
          <p className="mt-2 text-sm text-rose-600">{error}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">{status}</p>
        )}
      </section>
    </main>
  );
}
