const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/** Placeholders mantêm o build funcionando sem env; o browser avisa antes de tentar usar. */
export const SUPABASE_URL = rawUrl || "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY = rawAnonKey || "placeholder-anon-key";

export const hasSupabaseConfig = Boolean(rawUrl && rawAnonKey);

export function assertBrowserSupabaseConfig(): void {
  if (!hasSupabaseConfig) {
    throw new Error(
      "Supabase não configurado neste deploy. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel e faça um novo deploy.",
    );
  }
}
