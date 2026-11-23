"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusSelect } from "@/components/ui/status-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLIENT_STATUSES, type ClientStatus, type ClientType } from "@/lib/constants";

interface ClientForm {
  name: string;
  fantasyName: string;
  type: ClientType;
  status: ClientStatus;
  email: string;
  phone: string;
  city: string;
  state: string;
  segment: string;
  notes: string;
}

const EMPTY_FORM: ClientForm = {
  name: "",
  fantasyName: "",
  type: "PJ",
  status: "Lead",
  email: "",
  phone: "",
  city: "",
  state: "",
  segment: "",
  notes: "",
};

export default function ClientsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<ClientStatus | "all">("all");
  const [type, setType] = React.useState<ClientType | "all">("all");
  const [tag, setTag] = React.useState<string>("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState<ClientForm>(EMPTY_FORM);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", search, status, type, tag],
    queryFn: async () => {
      let query = supabase.from("clients").select("*");
      if (status !== "all") query = query.eq("status", status);
      if (type !== "all") query = query.eq("type", type);
      const { data, error } = await query;
      if (error) throw error;
      const list = (data ?? []).filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.fantasy_name ?? "").toLowerCase().includes(search.toLowerCase()),
      );
      return list;
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["clients-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("status");
      const map = new Map<string, number>();
      (data ?? []).forEach((c) => map.set(c.status, (map.get(c.status) ?? 0) + 1));
      return map;
    },
  });

  const { data: contractTotals } = useQuery({
    queryKey: ["contract-totals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("client_id, total_value");
      if (error) throw error;
      const map = new Map<string, number>();
      (data ?? []).forEach((c) => {
        map.set(c.client_id, (map.get(c.client_id) ?? 0) + Number(c.total_value ?? 0));
      });
      return map;
    },
  });

  const createClientRecord = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("clients").insert({
        user_id: auth.user.id,
        name: form.name.trim(),
        fantasy_name: form.fantasyName.trim() || null,
        type: form.type,
        status: form.status,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        segment: form.segment.trim() || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-counts"] });
      setForm(EMPTY_FORM);
      setAddOpen(false);
      toast({ title: "Cliente criado", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao criar cliente", variant: "error" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClientStatus }) => {
      const { error } = await supabase.from("clients").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-counts"] });
      toast({ title: "Status atualizado", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      });
    },
  });

  const canSubmit = form.name.trim().length > 0 && !createClientRecord.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="mt-1 text-secondary">
            {clients?.length ?? 0} clientes · {counts?.get("Ativo") ?? 0} ativos ·{" "}
            {counts?.get("Lead") ?? 0} leads
          </p>
        </div>
        <Button data-new-item onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por nome ou fantasia…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as ClientStatus | "all")}
          className="sm:max-w-[180px]"
        >
          <option value="all">Todos os status</option>
          {CLIENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={type}
          onValueChange={(v) => setType(v as ClientType | "all")}
          className="sm:max-w-[140px]"
        >
          <option value="all">PF/PJ</option>
          <option value="PF">PF</option>
          <option value="PJ">PJ</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !clients || clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Nenhum cliente encontrado"
          description="Cadastre seu primeiro cliente para começar a vender."
          action={
            <Button size="sm" data-new-item onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Cadastrar cliente
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/clients/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    {c.fantasy_name && <span className="ml-2 text-xs text-secondary">{c.fantasy_name}</span>}
                  </TableCell>
                  <TableCell className="text-secondary">{c.type}</TableCell>
                  <TableCell>
                    <div className="text-sm text-secondary">{c.email ?? "—"}</div>
                    <div className="text-xs text-tertiary">{c.phone ?? ""}</div>
                  </TableCell>
                  <TableCell>
                    <StatusSelect
                      ariaLabel={`Status de ${c.name}`}
                      value={c.status}
                      options={CLIENT_STATUSES}
                      onChange={(v) =>
                        updateStatus.mutate({ id: c.id, status: v as ClientStatus })
                      }
                      loading={updateStatus.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(contractTotals?.get(c.id) ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
            <DialogDescription>Cadastre os dados básicos. Você pode completar depois.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="client-name">Nome *</Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome ou razão social"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="client-fantasy">Nome fantasia</Label>
              <Input
                id="client-fantasy"
                value={form.fantasyName}
                onChange={(e) => setForm({ ...form, fantasyName: e.target.value })}
                placeholder="Como é conhecido"
              />
            </div>
            <div>
              <Label htmlFor="client-type">Tipo</Label>
              <Select
                id="client-type"
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as ClientType })}
              >
                <option value="PF">PF</option>
                <option value="PJ">PJ</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-status">Status</Label>
              <Select
                id="client-status"
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as ClientStatus })}
              >
                {CLIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="client-email">E-mail</Label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="client-phone">Telefone</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="client-city">Cidade</Label>
              <Input
                id="client-city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="client-state">UF</Label>
              <Input
                id="client-state"
                value={form.state}
                maxLength={2}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                placeholder="SP"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="client-segment">Segmento</Label>
              <Input
                id="client-segment"
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value })}
                placeholder="Marketing, Tecnologia…"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="client-notes">Observações</Label>
              <Textarea
                id="client-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={() => createClientRecord.mutate()}>
              {createClientRecord.isPending ? "Salvando…" : "Criar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
