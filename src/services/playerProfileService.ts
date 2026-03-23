import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export async function ensurePlayerProfile(user: User) {
  if (!supabase) return;

  const displayName =
    (typeof user.user_metadata?.display_name === "string" &&
      user.user_metadata.display_name.trim()) ||
    user.email?.split("@")[0] ||
    "Player";

  const { error } = await supabase.from("players").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      display_name: displayName,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}
