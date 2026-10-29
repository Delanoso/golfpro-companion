import { supabase } from "../lib/supabase";
import type { AppData } from "../types/app";
import { getPublicProfileByShareCode } from "./playerProfileService";

export type AppDataSyncSnapshot = {
  data: AppData | null;
  updatedAt: string | null;
};

const requiredClient = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
};

export async function loadPlayerAppData(userId: string): Promise<AppDataSyncSnapshot> {
  const client = requiredClient();
  const { data, error } = await client
    .from("player_app_data")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return { data: null, updatedAt: null };
  }
  return {
    data: (data.data ?? null) as AppData | null,
    updatedAt: typeof data.updated_at === "string" ? data.updated_at : null,
  };
}

export async function savePlayerAppData(userId: string, data: AppData): Promise<string> {
  const client = requiredClient();
  const updatedAt = new Date().toISOString();
  const { error } = await client.from("player_app_data").upsert(
    {
      user_id: userId,
      data,
      updated_at: updatedAt,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    throw new Error(error.message);
  }
  return updatedAt;
}

export function subscribeToPlayerAppData(
  userId: string,
  onRemoteUpdate: (snapshot: AppDataSyncSnapshot) => void,
) {
  const client = supabase;
  if (!client) {
    return () => undefined;
  }

  const channel = client
    .channel(`player-app-data-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "player_app_data", filter: `user_id=eq.${userId}` },
      (payload) => {
        const next = payload.new as { data?: AppData; updated_at?: string };
        onRemoteUpdate({
          data: (next.data ?? null) as AppData | null,
          updatedAt: typeof next.updated_at === "string" ? next.updated_at : null,
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "player_app_data", filter: `user_id=eq.${userId}` },
      (payload) => {
        const next = payload.new as { data?: AppData; updated_at?: string };
        onRemoteUpdate({
          data: (next.data ?? null) as AppData | null,
          updatedAt: typeof next.updated_at === "string" ? next.updated_at : null,
        });
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

export async function loadPublicAppDataByShareCode(shareCode: string): Promise<{
  displayName: string;
  appData: AppData;
} | null> {
  const profile = await getPublicProfileByShareCode(shareCode);
  if (!profile) return null;
  const snapshot = await loadPlayerAppData(profile.id);
  if (!snapshot.data) return null;
  return {
    displayName: profile.displayName,
    appData: snapshot.data,
  };
}
