import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { ensureShareCode, setPublicProfile, updatePlayerDisplayName } from "../../services/playerProfileService";
import type { PlayerProfile } from "../../types/app";

type AccountSettingsModalProps = {
  user: User;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (next: Partial<PlayerProfile>) => void;
};

export function AccountSettingsModal({
  user,
  profile,
  onClose,
  onUpdateProfile,
}: AccountSettingsModalProps) {
  const [displayName, setDisplayName] = useState(
    (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
      user.email?.split("@")[0] ||
      "Player",
  );
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPublicProfileEnabled, setIsPublicProfileEnabled] = useState(profile.publicShareEnabled);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shareUrl = useMemo(() => {
    if (!profile.shareCode) return "";
    return `${window.location.origin}/share/${profile.shareCode}`;
  }, [profile.shareCode]);

  const saveDisplayName = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const trimmed = displayName.trim();
      if (!trimmed) throw new Error("Display name is required.");
      await updatePlayerDisplayName(user.id, trimmed);
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
      });
      if (authError) throw new Error(authError.message);
      setStatus("Display name updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update display name.");
    } finally {
      setBusy(false);
    }
  };

  const saveEmail = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("Email is required.");
      }
      if (normalizedEmail === (user.email ?? "").toLowerCase()) {
        setStatus("That email is already your current email.");
        return;
      }
      const { error: authError } = await supabase.auth.updateUser({ email: normalizedEmail });
      if (authError) throw new Error(authError.message);
      setStatus("Email update requested. Check your inbox to confirm the new address.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to update email.";
      if (message.toLowerCase().includes("already registered")) {
        setError("This email is already in use by another account.");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw new Error(authError.message);
      setPassword("");
      setConfirmPassword("");
      setStatus("Password updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update password.");
    } finally {
      setBusy(false);
    }
  };

  const togglePublicProfile = async (enabled: boolean) => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await setPublicProfile(user.id, enabled);
      let nextShareCode = profile.shareCode;
      if (enabled && !nextShareCode) {
        nextShareCode = await ensureShareCode(user.id);
      }
      onUpdateProfile({
        publicShareEnabled: enabled,
        shareCode: nextShareCode ?? "",
      });
      setIsPublicProfileEnabled(enabled);
      setStatus(enabled ? "Public profile enabled." : "Public profile disabled.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update public profile.");
    } finally {
      setBusy(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Public profile link copied.");
      setError(null);
    } catch {
      setError("Unable to copy link.");
    }
  };

  const deleteAllData = async () => {
    if (!supabase) return;
    const confirmed = window.confirm("Delete all your saved golf data from cloud sync? This cannot be undone.");
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const { error: deleteError } = await supabase.from("player_app_data").delete().eq("user_id", user.id);
      if (deleteError) throw new Error(deleteError.message);
      setStatus("All cloud golf data deleted. Local app reset is available from Menu.");
    } catch (deleteDataError) {
      setError(deleteDataError instanceof Error ? deleteDataError.message : "Unable to delete data.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Account & Privacy</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Display name</p>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void saveDisplayName()}
              disabled={busy}
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Save display name
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Change email</p>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void saveEmail()}
              disabled={busy}
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Update email
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Change password</p>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => void savePassword()}
              disabled={busy}
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Update password
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Public profile sharing</p>
            <p className="mt-1 text-xs text-slate-600">
              Share your rounds + analytics with a public read-only link.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => void togglePublicProfile(true)}
                disabled={busy || isPublicProfileEnabled}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                Enable
              </button>
              <button
                type="button"
                onClick={() => void togglePublicProfile(false)}
                disabled={busy || !isPublicProfileEnabled}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
              >
                Disable
              </button>
            </div>
            {isPublicProfileEnabled && shareUrl && (
              <div className="mt-2 rounded-lg bg-white p-2 ring-1 ring-slate-200">
                <p className="break-all text-xs text-slate-700">{shareUrl}</p>
                <button
                  type="button"
                  onClick={() => void copyShareLink()}
                  className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Copy link
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Legal:{" "}
            <a href="/terms" className="font-semibold text-emerald-700">
              Terms
            </a>{" "}
            ·{" "}
            <a href="/privacy" className="font-semibold text-emerald-700">
              Privacy
            </a>
          </div>

          <div className="rounded-xl bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-800">Delete cloud data</p>
            <p className="mt-1 text-xs text-rose-700">
              Removes synced rounds, clubs, betting, and league settings from your account.
            </p>
            <button
              type="button"
              onClick={() => void deleteAllData()}
              disabled={busy}
              className="mt-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              Delete cloud data
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {status && <p className="mt-3 text-sm text-emerald-700">{status}</p>}
      </div>
    </div>
  );
}
