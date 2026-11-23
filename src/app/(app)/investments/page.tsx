"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Plus, Pencil, Trash2, Wallet, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/require-user";
import {
  INVESTMENT_CLASSES,
  type InvestmentClass,
} from "@/lib/constants";
import type { InvestmentPosition } from "@/lib/types/database";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatQuantity,
} from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

type PositionForm = {
  ticker: string;
  name: string;
  asset_class: InvestmentClass;
  quantity: string;
  average_price: string;
  current_price: string;
};

const emptyForm: PositionForm = {
  ticker: "",
  name: "",
  asset_class: "Ações",
  quantity: "",
  average_price: "",
  current_price: "",
};

function totalsFor(positions: InvestmentPosition[]) {
  const invested = positions.reduce(
    (sum, p) => sum + p.quantity * p.average_price,
    0,
  );
  const current = positions.reduce(
    (sum, p) => sum + p.quantity * (p.current_price ?? p.average_price),
    0,
  );
  return { invested, current, result: current - invested };
}

export default function InvestmentsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<InvestmentPosition | null>(null);
  const [form, setForm] = React.useState<PositionForm>(emptyForm);

  const { data: positions, isLoading } = useQuery({
    queryKey: ["investment-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_positions")
        .select("*")
        .eq("is_active", true)
        .order("asset_class")
        .order("ticker");
      if (error) throw error;
      return (data ?? []) as InvestmentPosition[];
    },
  });

  const invalidate = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["investment-positions"] });
  }, [queryClient]);

  const save = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const payload = {
        user_id: userId,
        ticker: form.ticker.trim().toUpperCase(),
        name: form.name.trim(),
        asset_class: form.asset_class,
        quantity: Number(form.quantity.replace(",", ".")),
        average_price: Number(form.average_price.replace(",", ".")),
        current_price: form.current_price.trim()
          ? Number(form.current_price.replace(",", "."))
          : null,
        price_as_of: new Date().toISOString().slice(0, 10),
      };
      if (!payload.ticker || !payload.name) throw new Error("Preencha ticker e nome.");
      if (Number.isNaN(payload.quantity) || payload.quantity < 0)
        throw new Error("Quantidade inválida.");
      if (Number.isNaN(payload.average_price) || payload.average_price < 0)
        throw new Error("Preço médio inválido.");

      if (editing) {
        const { error } = await supabase
          .from("investment_positions")
          .update({ ...payload, user_id: undefined })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("investment_positions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await invalidate();
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast({ title: "Ativo salvo", variant: "success" });
    },
    onError: (error) =>
      toast({
        title: "Não foi possível salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("investment_positions")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Ativo removido", variant: "info" });
    },
    onError: (error) =>
      toast({
        title: "Não foi possível remover",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      }),
  });

  const list = positions ?? [];
  const overall = totalsFor(list);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: InvestmentPosition) => {
    setEditing(p);
    setForm({
      ticker: p.ticker,
      name: p.name,
      asset_class: p.asset_class,
      quantity: String(p.quantity),
      average_price: String(p.average_price),
      current_price: p.current_price === null ? "" : String(p.current_price),
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Investimentos</h2>
          <p className="mt-1 text-secondary">Ações, FIIs e renda fixa em um só lugar.</p>
        </div>
        <Button data-new-item onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo ativo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total investido"
          value={formatCurrency(overall.invested)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Patrimônio atual"
          value={formatCurrency(overall.current)}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="Resultado"
          value={formatCurrency(overall.result)}
          hint={overall.invested ? formatPercent(overall.result / overall.invested) : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={overall.result >= 0 ? "up" : "down"}
        />
      </div>

      {INVESTMENT_CLASSES.map((assetClass) => {
        const items = list.filter((p) => p.asset_class === assetClass);
        const totals = totalsFor(items);
        return (
          <Card key={assetClass}>
            <CardHeader className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{assetClass}</CardTitle>
                <Badge variant={getStatusVariant(assetClass)}>{items.length} ativos</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary">
                <span>Investido: {formatCurrency(totals.invested)}</span>
                <span>Atual: {formatCurrency(totals.current)}</span>
                <span className={totals.result >= 0 ? "text-success" : "text-danger"}>
                  {formatCurrency(totals.result)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-tertiary">
                  Nenhum ativo cadastrado em {assetClass}.
                </p>
              ) : (
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ativo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Preço médio</TableHead>
                      <TableHead className="text-right">Preço atual</TableHead>
                      <TableHead className="text-right">Posição</TableHead>
                      <TableHead className="w-24 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((p) => {
                      const position = p.quantity * (p.current_price ?? p.average_price);
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <p className="font-medium">{p.ticker}</p>
                            <p className="max-w-[180px] truncate text-xs text-secondary">
                              {p.name}
                            </p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatQuantity(p.quantity)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(p.average_price)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.current_price === null ? "—" : formatCurrency(p.current_price)}
                            <p className="text-xs text-tertiary">{formatDate(p.price_as_of)}</p>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(position)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Editar ${p.ticker}`}
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Remover ${p.ticker}`}
                                onClick={() => remove.mutate(p.id)}
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!isLoading && list.length === 0 && (
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="Nenhum investimento ainda"
          description="Cadastre ações, FIIs ou renda fixa para acompanhar sua carteira."
          action={
            <Button size="sm" data-new-item onClick={openNew}>
              <Plus className="h-4 w-4" /> Adicionar ativo
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar ativo" : "Novo ativo"}</DialogTitle>
            <DialogDescription>
              Informe a posição atual. O preço médio é usado para calcular o resultado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ticker</label>
              <Input
                value={form.ticker}
                onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
                placeholder="PETR4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Classe</label>
              <Select
                value={form.asset_class}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, asset_class: v as InvestmentClass }))
                }
              >
                {INVESTMENT_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Petrobras PN"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço médio</label>
              <Input
                type="number"
                step="any"
                value={form.average_price}
                onChange={(e) => setForm((f) => ({ ...f, average_price: e.target.value }))}
                placeholder="22,50"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Preço atual (opcional)</label>
              <Input
                type="number"
                step="any"
                value={form.current_price}
                onChange={(e) => setForm((f) => ({ ...f, current_price: e.target.value }))}
                placeholder="24,80"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Salvando…" : "Salvar ativo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
