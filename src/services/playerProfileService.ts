import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type PlayerProfileRecord = {
  id: string;
  email: string;
  displayName: string;
  publicProfile: boolean;
  shareCode: string | null;
  createdAt: string;
  updatedAt: string;
};

const randomShareCode = () =>
  Math.random().toString(36).slice(2, 7).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();

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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

export async function getPlayerProfile(userId: string): Promise<PlayerProfileRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("players")
    .select("id, email, display_name, public_profile, share_code, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    publicProfile: data.public_profile,
    shareCode: data.share_code,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePlayerDisplayName(userId: string, displayName: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from("players")
    .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    throw error;
  }
}

export async function ensureShareCode(userId: string): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const existing = await getPlayerProfile(userId);
  if (existing?.shareCode) {
    return existing.shareCode;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const nextCode = randomShareCode();
    const { error } = await supabase
      .from("players")
      .update({ share_code: nextCode, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .is("share_code", null);
    if (!error) {
      return nextCode;
    }
    if (error.code !== "23505") {
      throw error;
    }
  }
  throw new Error("Unable to generate public share link. Please try again.");
}

export async function setPublicProfile(userId: string, enabled: boolean) {
  if (!supabase) return;
  const payload: { public_profile: boolean; updated_at: string; share_code?: string } = {
    public_profile: enabled,
    updated_at: new Date().toISOString(),
  };
  if (enabled) {
    payload.share_code = await ensureShareCode(userId);
  }
  const { error } = await supabase.from("players").update(payload).eq("id", userId);
  if (error) {
    throw error;
  }
}

export async function getPublicProfileByShareCode(shareCode: string): Promise<PlayerProfileRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("players")
    .select("id, email, display_name, public_profile, share_code, created_at, updated_at")
    .eq("share_code", shareCode.trim().toUpperCase())
    .eq("public_profile", true)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    publicProfile: data.public_profile,
    shareCode: data.share_code,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
