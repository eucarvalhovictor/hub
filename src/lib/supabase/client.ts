import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  assertBrowserSupabaseConfig,
} from "@/lib/supabase/config";

export function createClient(): SupabaseClient<Database, "public"> {
  assertBrowserSupabaseConfig();
  return createBrowserClient<Database, "public">(SUPABASE_URL, SUPABASE_ANON_KEY);
}
