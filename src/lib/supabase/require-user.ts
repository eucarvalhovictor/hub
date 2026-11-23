import { createClient } from "@/lib/supabase/client";

/** Retorna o usuário autenticado ou lança erro claro — nunca envia user_id vazio. */
export async function requireUserId(): Promise<string> {
  const { data, error } = await createClient().auth.getUser();
  if (error || !data.user) {
    throw new Error("Sessão expirada. Entre novamente para continuar.");
  }
  return data.user.id;
}
