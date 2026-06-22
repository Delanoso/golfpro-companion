import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL
)?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
)?.trim();

function getSupabaseConfigIssue() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return "Supabase URL and anon key are required for login and registration.";
  }

  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return "Supabase URL must start with https:// or http://.";
    }
  } catch {
    return "Supabase URL is not a valid URL. Use the Project URL from Supabase settings.";
  }

  return null;
}

export const supabaseConfigIssue = getSupabaseConfigIssue();
export const isSupabaseConfigured = !supabaseConfigIssue;
export const supabaseProjectHost = (() => {
  if (!supabaseUrl || supabaseConfigIssue) return null;
  return new URL(supabaseUrl).host;
})();

export const supabase =
  isSupabaseConfigured && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
