import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { RoundEntry } from "../types/app";

export type SharedLeague = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  isArchived: boolean;
  isLocked: boolean;
  createdAt: string;
};

export type SharedLeagueMember = {
  id: string;
  leagueId: string;
  userId: string;
  displayName: string;
  role: "member" | "admin";
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
  sourceRoundId?: string;
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
      .select("id, name, owner_id, invite_code, is_archived, is_locked, created_at")
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
      isArchived: data.is_archived,
      isLocked: data.is_locked,
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
    .select("id, name, owner_id, invite_code, is_archived, is_locked, created_at")
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
    isArchived: data.is_archived,
    isLocked: data.is_locked,
    createdAt: data.created_at,
  };
}

export async function getMySharedLeagues(userId: string): Promise<SharedLeague[]> {
  const client = requiredClient();
  const { data, error } = await client
    .from("league_members")
    .select("leagues(id, name, owner_id, invite_code, is_archived, is_locked, created_at)")
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? [])
    .map((row) => {
      const related = (
        row as {
          leagues:
            | {
                id: unknown;
                name: unknown;
                owner_id: unknown;
                invite_code: unknown;
                is_archived: unknown;
                is_locked: unknown;
                created_at: unknown;
              }
            | Array<{
                id: unknown;
                name: unknown;
                owner_id: unknown;
                invite_code: unknown;
                is_archived: unknown;
                is_locked: unknown;
                created_at: unknown;
              }>
            | null;
        }
      ).leagues;
      const league = Array.isArray(related) ? related[0] : related;
      if (!league) return null;
      return {
        id: String(league.id),
        name: String(league.name),
        ownerId: String(league.owner_id),
        inviteCode: String(league.invite_code),
        isArchived: Boolean(league.is_archived),
        isLocked: Boolean(league.is_locked),
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
    .select("id, league_id, user_id, display_name, role, joined_at")
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
    role: row.role,
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
    if (error.code === "23505") {
      throw new Error("That scorecard is already linked to this league.");
    }
    throw new Error(error.message);
  }
}

export async function getSharedLeagueRounds(leagueId: string): Promise<SharedLeagueRound[]> {
  const client = requiredClient();
  const { data, error } = await client
    .from("league_rounds")
    .select(
      "id, league_id, user_id, display_name, source_round_id, round_date, course, par, total_score, putts, one_putts, three_putts, holes, created_at",
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
    sourceRoundId: row.source_round_id ?? undefined,
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

export async function setLeagueState(
  leagueId: string,
  nextState: { isArchived?: boolean; isLocked?: boolean; name?: string },
): Promise<void> {
  const client = requiredClient();
  const payload: { is_archived?: boolean; is_locked?: boolean; name?: string } = {};
  if (typeof nextState.isArchived === "boolean") payload.is_archived = nextState.isArchived;
  if (typeof nextState.isLocked === "boolean") payload.is_locked = nextState.isLocked;
  if (typeof nextState.name === "string" && nextState.name.trim()) payload.name = nextState.name.trim();
  const { error } = await client.from("leagues").update(payload).eq("id", leagueId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function setMemberRole(
  membershipId: string,
  role: SharedLeagueMember["role"],
): Promise<void> {
  const client = requiredClient();
  const { error } = await client.from("league_members").update({ role }).eq("id", membershipId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function removeLeagueMember(membershipId: string): Promise<void> {
  const client = requiredClient();
  const { error } = await client.from("league_members").delete().eq("id", membershipId);
  if (error) {
    throw new Error(error.message);
  }
}
