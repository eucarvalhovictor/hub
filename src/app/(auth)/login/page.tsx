"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authInfo, setAuthInfo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    setAuthError(null);
    setAuthInfo(null);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setAuthInfo("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setAuthError(
          error.message === "Invalid login credentials"
            ? "E-mail ou senha inválidos."
            : error.message,
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao Supabase.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-start justify-center bg-background px-4 py-10 sm:items-center sm:py-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
            H
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Hub</h1>
          <p className="mt-1 text-sm text-secondary">Sua vida e gestão em um só lugar</p>
        </div>
        {!hasSupabaseConfig && (
          <p className="mb-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-xs leading-relaxed text-danger">
            Supabase não configurado neste deploy. Defina NEXT_PUBLIC_SUPABASE_URL e
            NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel e faça um novo deploy.
          </p>
        )}
        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? "Entrar" : "Criar conta"}</CardTitle>
            <CardDescription>
              {mode === "login" ? "Acesse sua conta para continuar." : "Comece a organizar sua vida e gestão."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                <Input id="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" {...register("email")} />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Senha</label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
              </div>
              {authError && <p className="text-sm text-danger">{authError}</p>}
              {authInfo && <p className="text-sm text-success">{authInfo}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando…" : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setAuthError(null);
                setAuthInfo(null);
              }}
              className="mt-4 w-full text-center text-sm text-secondary hover:text-foreground"
            >
              {mode === "login" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
