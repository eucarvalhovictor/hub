"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/layout/theme-provider";
import { Download, Sun, Moon } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const supabase = createClient();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const exportJson = async () => {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    const tables = [
      "clients",
      "contracts",
      "installments",
      "transactions",
      "accounts",
      "categories",
      "habits",
      "habit_logs",
      "goals",
      "goal_milestones",
      "tasks",
      "notes",
      "journal_entries",
    ] as const;
    type TableName = (typeof tables)[number];
    const payload: Record<string, unknown> = {};
    for (const t of tables) {
      const { data: rows, error } = await supabase.from(t).select("*");
      if (error) throw error;
      payload[t] = rows ?? [];
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async () => {
    const { data, error } = await supabase.from("transactions").select("*");
    if (error) throw error;
    const rows = (data ?? []).map((t) => ({
      data: t.date,
      tipo: t.type,
      categoria: t.context,
      valor: t.amount,
      conta: t.account_id ?? "",
      forma: t.payment_method ?? "",
      observacao: t.note ?? "",
    }));
    const header = ["data", "tipo", "contexto", "valor", "conta", "forma", "observacao"];
    const lines = [header.join(",")];
    rows.forEach((r) => {
      lines.push(
        [r.data, r.tipo, r.categoria, String(r.valor), r.conta, r.forma, r.observacao]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(","),
      );
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hub-transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="mt-1 text-secondary">Perfil, tema, dados e preferências.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Tema claro / escuro</p>
            <p className="text-xs text-secondary">Alternar entre o modo claro e escuro.</p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-secondary" />
            <Switch checked={!dark} onCheckedChange={toggle} aria-label="Alternar tema" />
            <Moon className="h-4 w-4 text-secondary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          {categories ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.id} className="rounded-md border border-border bg-muted px-2 py-1 text-xs">
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <Skeleton className="h-20 w-full" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportJson}>
            <Download className="h-4 w-4" /> Backup JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contas e carteiras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts && accounts.length === 0 && <p className="text-sm text-secondary">Nenhuma conta cadastrada.</p>}
          {(accounts ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-secondary">{a.type}</p>
              </div>
              <p className="font-semibold">{a.balance ? `R$ ${a.balance.toFixed(2).replace(".", ",")}` : "R$ 0,00"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
