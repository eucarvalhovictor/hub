"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PartyPopper, Plus } from "lucide-react";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Stage {
  id: string;
  name: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
}

interface Deal {
  id: string;
  client_id: string;
  title: string;
  stage_id: string;
  value: number | null;
  probability: number | null;
  expected_close_at: string | null;
  source: string | null;
  next_step: string | null;
  next_step_at: string | null;
  lost_reason: string | null;
  clients?: { name: string } | null;
}

interface ClientOption {
  id: string;
  name: string;
}

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { deal },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-md border border-border bg-card p-3 ${isDragging ? "opacity-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      <p className="text-sm font-medium">{deal.title}</p>
      <p className="mt-0.5 text-xs text-secondary">{deal.clients?.name ?? "—"}</p>
      {deal.value !== null && <p className="mt-1 text-sm font-semibold">{formatCurrency(deal.value)}</p>}
      {deal.next_step && <p className="mt-1 text-xs text-tertiary">Próximo: {deal.next_step}</p>}
    </div>
  );
}

export default function CrmPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [wonDealId, setWonDealId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    clientId: "",
    stageId: "",
    value: "",
    probability: "",
    expectedCloseAt: "",
    nextStep: "",
  });

  const { data: stages, isLoading: stagesLoading } = useQuery({
    queryKey: ["pipeline-stages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pipeline_stages").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Stage[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as ClientOption[];
    },
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*, clients(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Deal[];
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dealsByStage = React.useMemo(() => {
    const map = new Map<string, Deal[]>();
    (stages ?? []).forEach((s) => map.set(s.id, []));
    (deals ?? []).forEach((d) => {
      const arr = map.get(d.stage_id) ?? [];
      arr.push(d);
      map.set(d.stage_id, arr);
    });
    return map;
  }, [deals, stages]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeDeal = deals?.find((d) => d.id === active.id);
    const overStage = (stages ?? []).find((s) => s.id === (over.id as string));
    if (!activeDeal || !overStage) return;
    if (activeDeal.stage_id === overStage.id) return;

    const { error } = await supabase
      .from("deals")
      .update({ stage_id: overStage.id, updated_at: new Date().toISOString() })
      .eq("id", activeDeal.id);
    if (error) {
      toast({ title: "Erro ao mover oportunidade", variant: "error" });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["deals"] });
    if (overStage.is_won) setWonDealId(activeDeal.id);
  };

  const createDeal = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const stageId = form.stageId || (stages ?? [])[0]?.id;
      if (!stageId) throw new Error("Nenhum estágio configurado");
      const { error } = await supabase.from("deals").insert({
        user_id: auth.user.id,
        client_id: form.clientId,
        title: form.title.trim(),
        stage_id: stageId,
        value: form.value ? Number(form.value) : null,
        probability: form.probability ? Number(form.probability) : null,
        expected_close_at: form.expectedCloseAt || null,
        next_step: form.nextStep.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setForm({ title: "", clientId: "", stageId: "", value: "", probability: "", expectedCloseAt: "", nextStep: "" });
      setAddOpen(false);
      toast({ title: "Oportunidade criada", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao criar oportunidade", variant: "error" });
    },
  });

  const createContract = useMutation({
    mutationFn: async () => {
      const deal = (deals ?? []).find((d) => d.id === wonDealId);
      if (!deal) throw new Error("Oportunidade não encontrada");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const today = new Date().toISOString().slice(0, 10);
      const total = deal.value ?? 0;
      const { data: contract, error } = await supabase
        .from("contracts")
        .insert({
          user_id: auth.user.id,
          client_id: deal.client_id,
          description: deal.title,
          total_value: total,
          type: "Projeto fechado",
          installments_count: 1,
          first_installment_at: today,
          frequency: "Único",
          status: "Em andamento",
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: installmentError } = await supabase.from("installments").insert({
        user_id: auth.user.id,
        contract_id: contract.id,
        number: 1,
        value: total,
        due_at: today,
        status: "Pendente",
      });
      if (installmentError) throw installmentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract-totals"] });
      queryClient.invalidateQueries({ queryKey: ["installments-receivables"] });
      setWonDealId(null);
      toast({ title: "Contrato e parcela criados", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao criar contrato", variant: "error" });
    },
  });

  const canSubmit =
    form.title.trim().length > 0 && form.clientId.length > 0 && !createDeal.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CRM</h2>
          <p className="mt-1 text-secondary">Pipeline de vendas</p>
        </div>
        <Button data-new-item onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Nova oportunidade
        </Button>
      </div>

      {stagesLoading || dealsLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(stages ?? []).map((stage) => {
              const stageDeals = dealsByStage.get(stage.id) ?? [];
              return (
                <div key={stage.id} className="w-80 shrink-0 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">{stage.name}</p>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-secondary">{stageDeals.length}</span>
                  </div>
                  <SortableContext items={stageDeals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {stageDeals.map((d) => (
                        <DealCard key={d.id} deal={d} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova oportunidade</DialogTitle>
            <DialogDescription>Registre uma negociação no pipeline.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="deal-title">Título *</Label>
              <Input
                id="deal-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Projeto de site institucional"
              />
            </div>
            <div>
              <Label htmlFor="deal-client">Cliente *</Label>
              <Select
                id="deal-client"
                value={form.clientId}
                onValueChange={(v) => setForm({ ...form, clientId: v })}
              >
                <option value="">Selecione…</option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="deal-stage">Estágio</Label>
              <Select
                id="deal-stage"
                value={form.stageId}
                onValueChange={(v) => setForm({ ...form, stageId: v })}
              >
                <option value="">Primeiro estágio</option>
                {(stages ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="deal-value">Valor (R$)</Label>
              <Input
                id="deal-value"
                type="number"
                min={0}
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="deal-probability">Probabilidade (%)</Label>
              <Input
                id="deal-probability"
                type="number"
                min={0}
                max={100}
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="deal-close">Previsão de fechamento</Label>
              <Input
                id="deal-close"
                type="date"
                value={form.expectedCloseAt}
                onChange={(e) => setForm({ ...form, expectedCloseAt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="deal-next">Próximo passo</Label>
              <Input
                id="deal-next"
                value={form.nextStep}
                onChange={(e) => setForm({ ...form, nextStep: e.target.value })}
                placeholder="Enviar proposta"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={() => createDeal.mutate()}>
              {createDeal.isPending ? "Salvando…" : "Criar oportunidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!wonDealId} onOpenChange={(open) => { if (!open) setWonDealId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Negócio ganho
              <PartyPopper className="h-4 w-4 text-accent" />
            </DialogTitle>
            <DialogDescription>
              Deseja criar um contrato e gerar a parcela automaticamente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWonDealId(null)}>
              Ainda não
            </Button>
            <Button disabled={createContract.isPending} onClick={() => createContract.mutate()}>
              {createContract.isPending ? "Criando…" : "Criar contrato + parcela"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
