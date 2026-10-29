import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { RoundEntry } from "../types/app";

export type SharedLeague = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
};

export type SharedLeagueMember = {
  id: string;
  leagueId: string;
  userId: string;
  displayName: string;
  joinedAt: string;
};

export type SharedLeagueRound = {
  id: string;
  leagueId: string;
  userId: string;
  displayName: string;
  roundDate: string;
  course: string;
  par: number;
  totalScore: number;
  putts: number;
  onePutts: number;
  threePutts: number;
  holes: 9 | 18;
  createdAt: string;
};

const randomInviteCode = () =>
  Math.random().toString(36).slice(2, 6).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

const requiredClient = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
};

export async function createSharedLeague(name: string, user: User, displayName: string): Promise<SharedLeague> {
  const client = requiredClient();
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("League name is required.");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = randomInviteCode();
    const { data, error } = await client
      .from("leagues")
      .insert({
        name: trimmedName,
        owner_id: user.id,
        invite_code: inviteCode,
      })
      .select("id, name, owner_id, invite_code, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        continue;
      }
      throw new Error(error.message);
    }

    await ensureLeagueMembership(data.id, user.id, displayName);

    return {
      id: data.id,
      name: data.name,
      ownerId: data.owner_id,
      inviteCode: data.invite_code,
      createdAt: data.created_at,
    };
  }

  throw new Error("Unable to generate invite code. Please try again.");
}

async function ensureLeagueMembership(leagueId: string, userId: string, displayName: string) {
  const client = requiredClient();
  const { error } = await client.from("league_members").upsert(
    {
      league_id: leagueId,
      user_id: userId,
      display_name: displayName,
    },
    { onConflict: "league_id,user_id" },
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function joinSharedLeagueByCode(
  inviteCode: string,
  user: User,
  displayName: string,
): Promise<SharedLeague> {
  const client = requiredClient();
  const normalized = inviteCode.trim().toUpperCase();
  if (!normalized) {
    throw new Error("Invite code is required.");
  }
  const { data, error } = await client
    .from("leagues")
    .select("id, name, owner_id, invite_code, created_at")
    .eq("invite_code", normalized)
    .single();
  if (error || !data) {
    throw new Error("Invite code not found.");
  }

  await ensureLeagueMembership(data.id, user.id, displayName);

  return {
    id: data.id,
    name: data.name,
    ownerId: data.owner_id,
    inviteCode: data.invite_code,
    createdAt: data.created_at,
  };
}

export async function getMySharedLeagues(userId: string): Promise<SharedLeague[]> {
  const client = requiredClient();
  const { data, error } = await client
    .from("league_members")
    .select("leagues(id, name, owner_id, invite_code, created_at)")
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? [])
    .map((row) => {
      const league = (row as { leagues: Record<string, unknown> | null }).leagues;
      if (!league) return null;
      return {
        id: String(league.id),
        name: String(league.name),
        ownerId: String(league.owner_id),
        inviteCode: String(league.invite_code),
        createdAt: String(league.created_at),
      } satisfies SharedLeague;
    })
    .filter((league): league is SharedLeague => league !== null);

  return mapped.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSharedLeagueMembers(leagueId: string): Promise<SharedLeagueMember[]> {
  const client = requiredClient();
  const { data, error } = await client
    .from("league_members")
    .select("id, league_id, user_id, display_name, joined_at")
    .eq("league_id", leagueId)
    .order("joined_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    leagueId: row.league_id,
    userId: row.user_id,
    displayName: row.display_name,
    joinedAt: row.joined_at,
  }));
}

export async function linkRoundToLeague(
  leagueId: string,
  round: RoundEntry,
  userId: string,
  displayName: string,
): Promise<void> {
  const client = requiredClient();
  const { error } = await client.from("league_rounds").insert({
    league_id: leagueId,
    user_id: userId,
    display_name: displayName,
    source_round_id: round.id,
    round_date: round.date,
    course: round.course,
    par: round.par,
    total_score: round.totalScore,
    putts: round.putts,
    one_putts: round.onePutts,
    three_putts: round.threePutts,
    holes: round.holes,
    hole_scores: round.holeScores,
    wedge_shots: round.wedgeShots,
    notes: round.notes ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function getSharedLeagueRounds(leagueId: string): Promise<SharedLeagueRound[]> {
  const client = requiredClient();
  const { data, error } = await client
    .from("league_rounds")
    .select(
      "id, league_id, user_id, display_name, round_date, course, par, total_score, putts, one_putts, three_putts, holes, created_at",
    )
    .eq("league_id", leagueId)
    .order("round_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    leagueId: row.league_id,
    userId: row.user_id,
    displayName: row.display_name,
    roundDate: row.round_date,
    course: row.course,
    par: row.par,
    totalScore: row.total_score,
    putts: row.putts,
    onePutts: row.one_putts,
    threePutts: row.three_putts,
    holes: row.holes,
    createdAt: row.created_at,
  }));
}
