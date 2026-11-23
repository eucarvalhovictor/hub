"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, currentMonthKey, monthLabel } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart3, ChevronLeft, ChevronRight, Landmark, Plus, Receipt, Wallet } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function FinancePage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [context, setContext] = React.useState<"PJ" | "Pessoal">("PJ");
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());
  const [addOpen, setAddOpen] = React.useState(false);
  const [budgetOpen, setBudgetOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [budgetForm, setBudgetForm] = React.useState({ categoryId: "", amount: "" });
  const [accountForm, setAccountForm] = React.useState({
    name: "",
    type: "Conta corrente" as "Conta corrente" | "Cartão" | "Dinheiro" | "Investimentos",
    balance: "",
  });
  const [form, setForm] = React.useState({
    type: "Receita" as "Receita" | "Despesa",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    context: "PJ" as "PJ" | "Pessoal",
    accountId: "",
    note: "",
  });

  const monthStart = `${monthKey}-01`;
  const monthEnd = `${shiftMonth(monthKey, 1)}-01`;
  const isCurrentMonth = monthKey === currentMonthKey();

  const { data: summary } = useQuery({
    queryKey: ["finance-summary", context, monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, context")
        .eq("context", context)
        .gte("date", monthStart)
        .lt("date", monthEnd);
      if (error) throw error;
      let revenue = 0;
      let expenses = 0;
      (data ?? []).forEach((t) => {
        if (t.type === "Receita") revenue += t.amount;
        else expenses += t.amount;
      });
      return { revenue, expenses };
    },
  });

  const { data: chart } = useQuery({
    queryKey: ["finance-chart", context, monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, date")
        .eq("context", context)
        .lt("date", monthEnd);
      if (error) throw error;
      const map = new Map<string, { revenue: number; expenses: number }>();
      (data ?? []).forEach((t) => {
        const key = `${t.date?.slice(0, 7) ?? ""}`;
        const cur = map.get(key) ?? { revenue: 0, expenses: 0 };
        if (t.type === "Receita") cur.revenue += t.amount;
        else cur.expenses += t.amount;
        map.set(key, cur);
      });
      const arr: Array<{ month: string; Receita: number; Despesa: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const key = shiftMonth(monthKey, -i);
        const cur = map.get(key) ?? { revenue: 0, expenses: 0 };
        arr.push({ month: monthLabel(key).split(" ")[0], Receita: cur.revenue, Despesa: cur.expenses });
      }
      return arr;
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

  const { data: transactions } = useQuery({
    queryKey: ["transactions-recent", context, monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, type, amount, date, context, note")
        .eq("context", context)
        .gte("date", monthStart)
        .lt("date", monthEnd)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, type").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: budgets } = useQuery({
    queryKey: ["budgets", monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", monthStart);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: monthTransactions } = useQuery({
    queryKey: ["transactions-month-budget", monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, type, category_id")
        .gte("date", monthStart)
        .lt("date", monthEnd);
      if (error) throw error;
      return data ?? [];
    },
  });

  const createTransaction = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("transactions").insert({
        user_id: auth.user.id,
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
        context: form.context,
        account_id: form.accountId || null,
        note: form.note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-chart"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-recent"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-month"] });
      setForm({
        type: "Receita",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        context,
        accountId: "",
        note: "",
      });
      setAddOpen(false);
      toast({ title: "Lançamento criado", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao criar lançamento", variant: "error" });
    },
  });

  const saveBudget = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const existing = (budgets ?? []).find((b) => b.category_id === (budgetForm.categoryId || null));
      if (existing) {
        const { error } = await supabase
          .from("budgets")
          .update({ amount: Number(budgetForm.amount) })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budgets").insert({
          user_id: auth.user.id,
          category_id: budgetForm.categoryId || null,
          month: monthStart,
          amount: Number(budgetForm.amount),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setBudgetOpen(false);
      setBudgetForm({ categoryId: "", amount: "" });
      toast({ title: "Orçamento salvo", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar orçamento", variant: "error" });
    },
  });

  const balance = (accounts ?? []).reduce((acc, a) => acc + (a.balance ?? 0), 0);
  const canSubmit = Number(form.amount) > 0 && form.date.length > 0 && !createTransaction.isPending;
  const canSubmitBudget = Number(budgetForm.amount) > 0 && !saveBudget.isPending;

  const createAccount = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("accounts").insert({
        user_id: auth.user.id,
        name: accountForm.name.trim(),
        type: accountForm.type,
        balance: accountForm.balance ? Number(accountForm.balance) : 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setAccountOpen(false);
      setAccountForm({ name: "", type: "Conta corrente", balance: "" });
      toast({ title: "Carteira criada", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao criar carteira", variant: "error" });
    },
  });

  const canSubmitAccount = accountForm.name.trim().length > 0 && !createAccount.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="mt-1 text-secondary">Contas, lançamentos, orçamento e fluxo de caixa</p>
        </div>
        <Button
          data-new-item
          onClick={() => {
            setForm((f) => ({
              ...f,
              context,
              date: isCurrentMonth ? new Date().toISOString().slice(0, 10) : monthStart,
            }));
            setAddOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo lançamento
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["PJ", "Pessoal"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setContext(c)}
            className={`min-h-10 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              context === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-secondary hover:bg-muted"
            }`}
          >
            {c === "PJ" ? "Profissional (PJ)" : "Pessoal"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2"
          aria-label="Mês anterior"
          onClick={() => setMonthKey((key) => shiftMonth(key, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="month"
          aria-label="Filtrar por mês"
          value={monthKey}
          onChange={(event) => {
            if (event.target.value) setMonthKey(event.target.value);
          }}
          className="h-9 w-40"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2"
          aria-label="Próximo mês"
          disabled={isCurrentMonth}
          onClick={() => setMonthKey((key) => shiftMonth(key, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentMonth && (
          <Button variant="ghost" size="sm" className="h-9" onClick={() => setMonthKey(currentMonthKey())}>
            Voltar ao mês atual
          </Button>
        )}
        <span className="ml-auto text-sm font-medium text-secondary">{monthLabel(monthKey)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Receita do mês"
          value={formatCurrency(summary?.revenue ?? 0)}
          hint={monthLabel(monthKey)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Despesas do mês"
          value={formatCurrency(summary?.expenses ?? 0)}
          hint={monthLabel(monthKey)}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          label="Saldo do mês"
          value={formatCurrency((summary?.revenue ?? 0) - (summary?.expenses ?? 0))}
          hint={monthLabel(monthKey)}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="Saldo em contas"
          value={formatCurrency(balance)}
          hint={`${accounts?.length ?? 0} carteiras`}
          icon={<Landmark className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fluxo de caixa · 12 meses até {monthLabel(monthKey)}</CardTitle>
          </CardHeader>
          <CardContent>
            {chart ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chart} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,53,47,0.09)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "rgba(55,53,47,0.65)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "rgba(55,53,47,0.65)" }} tickFormatter={(v: number) => `R$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="Receita" fill="#2383E2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesa" fill="#EB5757" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Carteiras</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAccountOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Nova
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(accounts ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-secondary">{a.type}</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(a.balance)}</p>
              </div>
            ))}
            {(!accounts || accounts.length === 0) && (
              <EmptyState
                icon={<Landmark className="h-5 w-5" />}
                title="Sem carteiras"
                description="Cadastre contas e carteiras."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Orçamento · {monthLabel(monthKey)}</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setBudgetOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Definir
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(budgets ?? []).length === 0 && (
            <p className="py-2 text-sm text-secondary">Nenhum orçamento definido para este mês.</p>
          )}
          {(budgets ?? []).map((b) => {
            const cat = (categories ?? []).find((c) => c.id === b.category_id);
            const spent = (monthTransactions ?? [])
              .filter((t) => t.type === "Despesa" && t.category_id === b.category_id)
              .reduce((acc, t) => acc + t.amount, 0);
            const pct = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{cat?.name ?? "Geral"}</span>
                  <span className="text-secondary">
                    {formatCurrency(spent)} / {formatCurrency(b.amount)}
                  </span>
                </div>
                <ProgressBar value={pct} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos · {monthLabel(monthKey)}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions ? (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted">
                  <div>
                    <p className="text-sm font-medium">{t.note ?? "Lançamento"}</p>
                    <p className="text-xs text-secondary">{t.context} · {formatDate(t.date)}</p>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === "Receita" ? "text-success" : "text-danger"}`}>
                    {t.type === "Receita" ? "+" : "-"}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))}
              {transactions.length === 0 && <EmptyState icon={<Receipt className="h-5 w-5" />} title="Sem lançamentos" />}
            </div>
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
            <DialogDescription>Registre uma receita ou despesa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="tx-type">Tipo</Label>
              <Select
                id="tx-type"
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as "Receita" | "Despesa" })}
              >
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="tx-context">Contexto</Label>
              <Select
                id="tx-context"
                value={form.context}
                onValueChange={(v) => setForm({ ...form, context: v as "PJ" | "Pessoal" })}
              >
                <option value="PJ">PJ</option>
                <option value="Pessoal">Pessoal</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="tx-amount">Valor (R$) *</Label>
              <Input
                id="tx-amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tx-date">Data *</Label>
              <Input
                id="tx-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tx-account">Carteira</Label>
              <Select
                id="tx-account"
                value={form.accountId}
                onValueChange={(v) => setForm({ ...form, accountId: v })}
              >
                <option value="">Sem carteira</option>
                {(accounts ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="tx-note">Descrição</Label>
              <Input
                id="tx-note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Ex.: Mensalidade cliente X"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={() => createTransaction.mutate()}>
              {createTransaction.isPending ? "Salvando…" : "Criar lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir orçamento</DialogTitle>
            <DialogDescription>Limite de gastos por categoria neste mês.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="budget-category">Categoria</Label>
              <Select
                id="budget-category"
                value={budgetForm.categoryId}
                onValueChange={(v) => setBudgetForm({ ...budgetForm, categoryId: v })}
              >
                <option value="">Geral</option>
                {(categories ?? [])
                  .filter((c) => c.type === "Despesa")
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="budget-amount">Valor (R$) *</Label>
              <Input
                id="budget-amount"
                type="number"
                min={0}
                step="0.01"
                value={budgetForm.amount}
                onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBudgetOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSubmitBudget} onClick={() => saveBudget.mutate()}>
              {saveBudget.isPending ? "Salvando…" : "Salvar orçamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova carteira</DialogTitle>
            <DialogDescription>Conta bancária, cartão, dinheiro ou investimento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="account-name">Nome *</Label>
              <Input
                id="account-name"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                placeholder="Ex.: Nubank PJ"
              />
            </div>
            <div>
              <Label htmlFor="account-type">Tipo</Label>
              <Select
                id="account-type"
                value={accountForm.type}
                onValueChange={(v) =>
                  setAccountForm({
                    ...accountForm,
                    type: v as "Conta corrente" | "Cartão" | "Dinheiro" | "Investimentos",
                  })
                }
              >
                <option value="Conta corrente">Conta corrente</option>
                <option value="Cartão">Cartão</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Investimentos">Investimentos</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="account-balance">Saldo inicial (R$)</Label>
              <Input
                id="account-balance"
                type="number"
                step="0.01"
                value={accountForm.balance}
                onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSubmitAccount} onClick={() => createAccount.mutate()}>
              {createAccount.isPending ? "Salvando…" : "Criar carteira"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
