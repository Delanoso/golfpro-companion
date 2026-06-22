import { supabaseProjectHost } from "./supabase";

const NETWORK_ERROR_PATTERNS = [
  "failed to fetch",
  "load failed",
  "networkerror",
  "network request failed",
  "fetch failed",
];

function isNetworkErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function formatAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (message && isNetworkErrorMessage(message)) {
    const hostText = supabaseProjectHost ? ` at ${supabaseProjectHost}` : "";
    return `Unable to reach Supabase Auth${hostText}. Check that VITE_SUPABASE_URL is the exact Supabase Project URL and VITE_SUPABASE_ANON_KEY is the anon/public key for the same project, then rebuild and redeploy.`;
  }

  return message || "Authentication failed. Please try again.";
}
