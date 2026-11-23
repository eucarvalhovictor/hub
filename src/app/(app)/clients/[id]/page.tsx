"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/require-user";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  CLIENT_STATUSES,
  CONTRACT_SERVICE_TYPES,
  CONTRACT_STATUSES,
  INSTALLMENT_STATUSES,
  PAYMENT_METHODS,
  type ClientStatus,
  type ContractServiceType,
  type ContractStatus,
  type InstallmentStatus,
  type PaymentMethod,
} from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusSelect } from "@/components/ui/status-select";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  FolderKanban,
  Handshake,
  Paperclip,
  Plus,
  Search,
  StickyNote,
} from "lucide-react";
import { addMonths, format } from "date-fns";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "financial", label: "Contratos e financeiro" },
  { id: "crm", label: "CRM/Interações" },
  { id: "projects", label: "Projetos/Tarefas" },
  { id: "files", label: "Arquivos" },
  { id: "notes", label: "Notas" },
];

interface ContractRow {
  id: string;
  client_id: string;
  description: string | null;
  total_value: number;
  type: string;
  service_type: string | null;
  installments_count: number;
  first_installment_at: string;
  frequency: string | null;
  payment_method: string | null;
  status: string;
  installments?: Array<{
    id: string;
    number: number;
    value: number;
    due_at: string;
    status: string;
    paid_at: string | null;
    paid_value: number | null;
    payment_method: string | null;
  }>;
}

interface ClientRow {
  id: string;
  name: string;
  fantasy_name: string | null;
  type: string;
  status: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  segment: string | null;
  notes: string | null;
  created_at: string;
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = params.id;
  const supabase = createClient();
  const [tab, setTab] = React.useState("overview");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: "",
    fantasyName: "",
    status: "Lead",
    email: "",
    phone: "",
    city: "",
    state: "",
    segment: "",
    notes: "",
  });
  const [contractOpen, setContractOpen] = React.useState(false);
  const [contractForm, setContractForm] = React.useState({
    description: "",
    serviceType: "Outro" as ContractServiceType,
    totalValue: "",
    installments: "1",
    firstDate: new Date().toISOString().slice(0, 10),
    frequency: "Único" as "Mensal" | "Anual" | "Único",
    type: "Projeto fechado" as "Projeto fechado" | "Recorrente mensal" | "Hora",
    paymentMethod: "PIX" as PaymentMethod,
  });
  const [paymentDrafts, setPaymentDrafts] = React.useState<Record<string, PaymentMethod>>({});

  const invalidateInstallmentData = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["installments-receivables"] });
    queryClient.invalidateQueries({ queryKey: ["contracts", clientId] });
    queryClient.invalidateQueries({ queryKey: ["transactions-recent"] });
    queryClient.invalidateQueries({ queryKey: ["transactions-month"] });
    queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
    queryClient.invalidateQueries({ queryKey: ["monthly_cashflow"] });
  }, [queryClient, clientId]);

  const updateInstallmentStatus = useMutation({
    mutationFn: async ({
      id,
      value,
      status,
      paymentMethod,
    }: {
      id: string;
      value: number;
      status: InstallmentStatus;
      paymentMethod?: PaymentMethod | null;
    }) => {
      const isPaid = status === "Paga";
      const { error } = await supabase
        .from("installments")
        .update({
          status,
          paid_at: isPaid ? new Date().toISOString() : null,
          paid_value: isPaid ? value : null,
          ...(isPaid && paymentMethod ? { payment_method: paymentMethod } : {}),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      invalidateInstallmentData();
      const titles: Record<InstallmentStatus, string> = {
        Pendente: "Parcela marcada como pendente",
        Paga: "Parcela marcada como paga",
        Atrasada: "Parcela marcada como atrasada",
        Cancelada: "Parcela cancelada",
      };
      toast({
        title: titles[vars.status],
        variant: vars.status === "Paga" ? "success" : "info",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar parcela",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      });
    },
  });

  const setInstallmentPaymentMethod = useMutation({
    mutationFn: async ({ id, method }: { id: string; method: PaymentMethod }) => {
      const { error } = await supabase
        .from("installments")
        .update({ payment_method: method })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateInstallmentData,
    onError: () => toast({ title: "Erro ao salvar forma de pagamento", variant: "error" }),
  });

  const updateClient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clients")
        .update({
          name: editForm.name.trim(),
          fantasy_name: editForm.fantasyName.trim() || null,
          status: editForm.status as ClientStatus,
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          city: editForm.city.trim() || null,
          state: editForm.state.trim() || null,
          segment: editForm.segment.trim() || null,
          notes: editForm.notes.trim() || null,
        })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditOpen(false);
      toast({ title: "Cliente atualizado", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar cliente", variant: "error" });
    },
  });

  const updateClientStatus = useMutation({
    mutationFn: async (status: ClientStatus) => {
      const { error } = await supabase.from("clients").update({ status }).eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Status do cliente atualizado", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status do cliente",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      });
    },
  });

  const updateContractStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContractStatus }) => {
      const { error } = await supabase
        .from("contracts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", clientId] });
      toast({ title: "Status do contrato atualizado", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status do contrato",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      });
    },
  });

  const createContract = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const total = Number(contractForm.totalValue);
      const count = Math.max(1, Number(contractForm.installments) || 1);
      const first = contractForm.firstDate;
      const { data: contract, error } = await supabase
        .from("contracts")
        .insert({
          user_id: userId,
          client_id: clientId,
          description: contractForm.description.trim() || null,
          service_type: contractForm.serviceType,
          total_value: total,
          type: contractForm.type,
          installments_count: count,
          first_installment_at: first,
          frequency: contractForm.frequency,
          payment_method: contractForm.paymentMethod,
          status: "Em andamento",
        })
        .select("id")
        .single();
      if (error) throw error;
      const base = Math.floor((total / count) * 100) / 100;
      const rows = Array.from({ length: count }).map((_, i) => {
        const value = i === count - 1 ? Number((total - base * (count - 1)).toFixed(2)) : base;
        return {
          user_id: userId,
          contract_id: contract.id,
          number: i + 1,
          value,
          due_at: format(addMonths(new Date(`${first}T12:00:00`), i), "yyyy-MM-dd"),
          status: "Pendente" as const,
          payment_method: contractForm.paymentMethod,
        };
      });
      const { error: installmentError } = await supabase.from("installments").insert(rows);
      if (installmentError) throw installmentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["contract-totals"] });
      queryClient.invalidateQueries({ queryKey: ["installments-receivables"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      setContractOpen(false);
      setContractForm({
        description: "",
        serviceType: "Outro",
        totalValue: "",
        installments: "1",
        firstDate: new Date().toISOString().slice(0, 10),
        frequency: "Único",
        type: "Projeto fechado",
        paymentMethod: "PIX",
      });
      toast({ title: "Contrato e parcelas criados", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar contrato",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      });
    },
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ["clients", clientId],
    queryFn: async (): Promise<ClientRow | null> => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
      if (error) throw error;
      return data as ClientRow | null;
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ["contracts", clientId],
    queryFn: async (): Promise<ContractRow[]> => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, installments(*)")
        .eq("client_id", clientId);
      if (error) throw error;
      return (data ?? []) as unknown as ContractRow[];
    },
  });

  React.useEffect(() => {
    if (client) {
      setEditForm({
        name: client.name,
        fantasyName: client.fantasy_name ?? "",
        status: client.status,
        email: client.email ?? "",
        phone: client.phone ?? "",
        city: client.city ?? "",
        state: client.state ?? "",
        segment: client.segment ?? "",
        notes: client.notes ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <EmptyState
        icon={<Search className="h-5 w-5" />}
        title="Cliente não encontrado"
        description="Pode ser que ele tenha sido removido."
        action={<Button size="sm" asChild><Link href="/clients">Voltar para clientes</Link></Button>}
      />
    );
  }

  const totalValue = (contracts ?? []).reduce((acc, c) => acc + (c.total_value ?? 0), 0);
  const paidValue = (contracts ?? []).reduce(
    (acc, c) => acc + (c.installments ?? []).filter((i) => i.status === "Paga").reduce((a, i) => a + i.value, 0),
    0,
  );
  const pendingValue = (contracts ?? []).reduce(
    (acc, c) => acc + (c.installments ?? []).filter((i) => i.status === "Pendente").reduce((a, i) => a + i.value, 0),
    0,
  );

  const tabsWithContent = (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>{client.name}</CardTitle>
              <CardDescription>
                {client.fantasy_name ?? "Sem fantasia"} · {client.type} · {client.status}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-secondary">Contato</p>
                  <p className="text-sm">{client.email ?? "—"}</p>
                  <p className="text-sm text-secondary">{client.phone ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-secondary">Localização</p>
                  <p className="text-sm">{client.city ? `${client.city}/${client.state}` : "—"}</p>
                  <p className="text-sm text-secondary">{client.segment ?? "—"}</p>
                </div>
              </div>
              {client.notes && (
                <div>
                  <p className="text-xs font-medium text-secondary">Observações</p>
                  <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contratos e parcelas</CardTitle>
                <CardDescription>
                  Valor total contratado: {formatCurrency(totalValue)} · Pago: {formatCurrency(paidValue)} · A receber:{" "}
                  {formatCurrency(pendingValue)}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setContractOpen(true)}>
                <Plus className="h-4 w-4" /> Novo contrato
              </Button>
            </CardHeader>
            <CardContent>
              {(contracts ?? []).length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-5 w-5" />}
                  title="Nenhum contrato"
                  description="Crie um contrato para gerar parcelas automaticamente."
                />
              ) : (
                <div className="space-y-4">
                  {(contracts ?? []).map((c) => (
                    <div key={c.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-medium">{c.description ?? "Contrato"}</p>
                          <p className="text-xs text-secondary">
                            {c.service_type ?? "Outro"} · {c.type} · {c.installments_count} parcelas ·{" "}
                            {c.frequency ?? "—"}
                          </p>
                          {c.payment_method && (
                            <p className="mt-1 text-xs text-tertiary">
                              Forma de pagamento: {c.payment_method}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <p className="font-semibold tabular-nums">{formatCurrency(c.total_value)}</p>
                          <StatusSelect
                            ariaLabel="Status do contrato"
                            value={c.status}
                            options={CONTRACT_STATUSES}
                            onChange={(v) =>
                              updateContractStatus.mutate({
                                id: c.id,
                                status: v as ContractStatus,
                              })
                            }
                            loading={updateContractStatus.isPending}
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {(c.installments ?? []).map((i) => {
                          const paymentMethod =
                            paymentDrafts[i.id] ??
                            (PAYMENT_METHODS.includes(i.payment_method as PaymentMethod)
                              ? (i.payment_method as PaymentMethod)
                              : "PIX");
                          return (
                            <div
                              key={i.id}
                              className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                            >
                              <span className="tabular-nums">
                                {i.number}/{c.installments_count} · vence {formatDate(i.due_at)}
                              </span>
                              <StatusSelect
                                ariaLabel={`Status da parcela ${i.number}`}
                                value={i.status}
                                options={INSTALLMENT_STATUSES}
                                onChange={(v) =>
                                  updateInstallmentStatus.mutate({
                                    id: i.id,
                                    value: i.value,
                                    status: v as InstallmentStatus,
                                    paymentMethod,
                                  })
                                }
                                loading={updateInstallmentStatus.isPending}
                              />
                              {i.status !== "Paga" && i.status !== "Cancelada" && (
                                <Select
                                  aria-label={`Forma de pagamento da parcela ${i.number}`}
                                  value={paymentMethod}
                                  onValueChange={(v) => {
                                    const method = v as PaymentMethod;
                                    setPaymentDrafts((d) => ({ ...d, [i.id]: method }));
                                    setInstallmentPaymentMethod.mutate({ id: i.id, method });
                                  }}
                                  className="h-9 w-28 px-2 text-xs"
                                >
                                  {PAYMENT_METHODS.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </Select>
                              )}
                              <span className="ml-auto tabular-nums">{formatCurrency(i.value)}</span>
                              {i.status === "Paga" && (
                                <Badge variant="outline" title={i.payment_method ?? undefined}>
                                  {i.payment_method ?? "Paga"}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm">
          <Card>
            <CardHeader>
              <CardTitle>Interações e negociações</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Handshake className="h-5 w-5" />}
                title="Nenhuma interação registrada"
                description="Registre reuniões, ligações e propostas neste cliente."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projetos e tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<FolderKanban className="h-5 w-5" />}
                title="Nenhum projeto"
                description="Projetos e tarefas ligados aparecerão aqui."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Arquivos</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Paperclip className="h-5 w-5" />}
                title="Nenhum arquivo"
                description="Contratos, briefings e propostas ficam aqui."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<StickyNote className="h-5 w-5" />}
                title="Sem notas"
                description="Anotações sobre este cliente."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <Button size="sm" onClick={() => setEditOpen(true)}>Editar cliente</Button>
      </div>
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-4xl font-bold tracking-tight">{client.name}</h2>
          <StatusSelect
            ariaLabel="Status do cliente"
            value={client.status}
            options={CLIENT_STATUSES}
            onChange={(v) => updateClientStatus.mutate(v as ClientStatus)}
            loading={updateClientStatus.isPending}
          />
        </div>
        <p className="mt-1 text-secondary">{client.fantasy_name ?? "Sem fantasia"}</p>
      </div>
      {tabsWithContent}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>Atualize os dados do cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="edit-fantasy">Nome fantasia</Label>
              <Input
                id="edit-fantasy"
                value={editForm.fantasyName}
                onChange={(e) => setEditForm({ ...editForm, fantasyName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                id="edit-status"
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                {CLIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-city">Cidade</Label>
              <Input
                id="edit-city"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-state">UF</Label>
              <Input
                id="edit-state"
                maxLength={2}
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label htmlFor="edit-segment">Segmento</Label>
              <Input
                id="edit-segment"
                value={editForm.segment}
                onChange={(e) => setEditForm({ ...editForm, segment: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!editForm.name.trim() || updateClient.isPending}
              onClick={() => updateClient.mutate()}
            >
              {updateClient.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contractOpen} onOpenChange={setContractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo contrato</DialogTitle>
            <DialogDescription>As parcelas são geradas automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="contract-desc">Descrição</Label>
              <Input
                id="contract-desc"
                value={contractForm.description}
                onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                placeholder="Ex.: Site institucional"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="contract-service">Tipo de serviço prestado</Label>
              <Select
                id="contract-service"
                value={contractForm.serviceType}
                onValueChange={(v) =>
                  setContractForm({ ...contractForm, serviceType: v as ContractServiceType })
                }
              >
                {CONTRACT_SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="contract-total">Valor total (R$) *</Label>
              <Input
                id="contract-total"
                type="number"
                min={0}
                step="0.01"
                value={contractForm.totalValue}
                onChange={(e) => setContractForm({ ...contractForm, totalValue: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contract-count">Parcelas</Label>
              <Input
                id="contract-count"
                type="number"
                min={1}
                value={contractForm.installments}
                onChange={(e) => setContractForm({ ...contractForm, installments: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contract-first">1ª parcela</Label>
              <Input
                id="contract-first"
                type="date"
                value={contractForm.firstDate}
                onChange={(e) => setContractForm({ ...contractForm, firstDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contract-frequency">Frequência</Label>
              <Select
                id="contract-frequency"
                value={contractForm.frequency}
                onValueChange={(v) =>
                  setContractForm({ ...contractForm, frequency: v as "Mensal" | "Anual" | "Único" })
                }
              >
                <option value="Único">Único</option>
                <option value="Mensal">Mensal</option>
                <option value="Anual">Anual</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="contract-type">Tipo de contrato</Label>
              <Select
                id="contract-type"
                value={contractForm.type}
                onValueChange={(v) =>
                  setContractForm({ ...contractForm, type: v as "Projeto fechado" | "Recorrente mensal" | "Hora" })
                }
              >
                <option value="Projeto fechado">Projeto fechado</option>
                <option value="Recorrente mensal">Recorrente mensal</option>
                <option value="Hora">Hora</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="contract-payment">Forma de pagamento</Label>
              <Select
                id="contract-payment"
                value={contractForm.paymentMethod}
                onValueChange={(v) =>
                  setContractForm({ ...contractForm, paymentMethod: v as PaymentMethod })
                }
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                Number(contractForm.totalValue) <= 0 ||
                !contractForm.firstDate ||
                createContract.isPending
              }
              onClick={() => createContract.mutate()}
            >
              {createContract.isPending ? "Criando…" : "Criar contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
