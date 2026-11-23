"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/require-user";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { StatusSelect } from "@/components/ui/status-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Target } from "lucide-react";
import { GOAL_AREAS, GOAL_STATUSES, type GoalArea, type GoalStatus } from "@/lib/constants";

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  area: string;
  metric: string | null;
  current_value: number | null;
  target_value: number | null;
  unit: string | null;
  deadline: string | null;
  status: string;
}

interface Milestone {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  done: boolean;
  due_at: string | null;
}

interface GoalReview {
  id: string;
  user_id: string;
  goal_id: string | null;
  kind: string;
  notes: string | null;
  created_at: string;
}

export default function GoalsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = React.useState(false);
  const [progressDrafts, setProgressDrafts] = React.useState<Record<string, string>>({});
  const [title, setTitle] = React.useState("");
  const [area, setArea] = React.useState<GoalArea>("Financeira");
  const [targetValue, setTargetValue] = React.useState("");
  const [deadline, setDeadline] = React.useState("");

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*");
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });

  const { data: milestones } = useQuery({
    queryKey: ["goal-milestones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("goal_milestones").select("*");
      if (error) throw error;
      return (data ?? []) as Milestone[];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["goal-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("goal_reviews").select("*");
      if (error) throw error;
      return (data ?? []) as GoalReview[];
    },
  });

  const addGoal = async () => {
    if (!title.trim()) return;
    const { error } = await supabase.from("goals").insert({
      user_id: await requireUserId(),
      title: title.trim(),
      area,
      status: "Não iniciada",
      current_value: 0,
      target_value: targetValue ? Number(targetValue) : null,
      unit: "unidade",
      deadline: deadline || null,
    });
    if (error) throw error;
    setAddOpen(false);
    setTitle("");
    setTargetValue("");
    setDeadline("");
    await queryClient.invalidateQueries({ queryKey: ["goals"] });
  };

  const changeStatus = async (goal: Goal, status: GoalStatus) => {
    try {
      const { error } = await supabase
        .from("goals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", goal.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Status atualizado", variant: "success" });
    } catch (error) {
      toast({
        title: "Não foi possível atualizar o status",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      });
    }
  };

  const saveProgress = async (goal: Goal) => {
    const raw = progressDrafts[goal.id];
    if (raw === undefined || raw.trim() === "") return;
    const value = Number(raw.replace(",", "."));
    if (Number.isNaN(value)) {
      toast({ title: "Informe um número válido", variant: "error" });
      return;
    }
    try {
      const { error } = await supabase
        .from("goals")
        .update({ current_value: value, updated_at: new Date().toISOString() })
        .eq("id", goal.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Progresso salvo", variant: "success" });
    } catch (error) {
      toast({
        title: "Não foi possível salvar o progresso",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "error",
      });
    }
  };

  const goalsList = goals ?? [];
  const activeGoals = goalsList.filter((g) => g.status === "Em andamento");
  const achieved = goalsList.filter((g) => g.status === "Concluída");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Metas</h2>
          <p className="mt-1 text-secondary">Metas por área da vida, com marcos e revisões.</p>
        </div>
        <Button data-new-item onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Nova meta
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : goalsList.length === 0 ? (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="Nenhuma meta ainda"
          description="Defina metas para áreas como finanças, saúde e estudos."
          action={
            <Button size="sm" data-new-item onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Criar meta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goalsList.map((g) => {
            const goalMilestones = milestones?.filter((m) => m.goal_id === g.id) ?? [];
            const doneMilestones = goalMilestones.filter((m) => m.done).length;
            return (
              <Card key={g.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold sm:text-lg">{g.title}</h3>
                      <p className="text-xs text-secondary">{g.area}</p>
                    </div>
                    <StatusSelect
                      ariaLabel="Status da meta"
                      value={g.status}
                      options={GOAL_STATUSES}
                      onChange={(v) => void changeStatus(g, v as GoalStatus)}
                      className="shrink-0"
                    />
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-secondary">
                      <span className="tabular-nums">
                        {g.current_value ?? 0}/{g.target_value ?? 0} {g.unit}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Input
                        type="number"
                        step="any"
                        aria-label="Novo progresso"
                        placeholder="Novo progresso"
                        value={progressDrafts[g.id] ?? ""}
                        onChange={(e) =>
                          setProgressDrafts((d) => ({ ...d, [g.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveProgress(g);
                        }}
                        className="h-10 flex-1 sm:h-9"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void saveProgress(g)}
                        disabled={
                          progressDrafts[g.id] === undefined ||
                          progressDrafts[g.id]?.trim() === ""
                        }
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  {g.deadline && (
                    <p className="mt-2 text-xs text-tertiary">Prazo: {formatDate(g.deadline)}</p>
                  )}
                  {goalMilestones.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {goalMilestones.map((m) => (
                        <label key={m.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={m.done}
                            onChange={async () => {
                              const { error } = await supabase.from("goal_milestones").update({ done: !m.done }).eq("id", m.id);
                              if (error) throw error;
                              await queryClient.invalidateQueries({ queryKey: ["goal-milestones"] });
                            }}
                            className="h-4 w-4 accent-[#2383E2]"
                          />
                          <span className={m.done ? "text-secondary line-through" : ""}>{m.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Revisões recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {(reviews ?? []).length === 0 ? (
            <p className="text-sm text-secondary">Nenhuma revisão registrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {(reviews ?? [])
                .slice()
                .reverse()
                .slice(0, 5)
                .map((r) => (
                  <div key={r.id} className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium">{r.kind}</p>
                    {r.notes && <p className="mt-1 text-secondary">{r.notes}</p>}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova meta</DialogTitle>
            <DialogDescription>Defina uma meta para uma área da vida.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Economizar R$ 10.000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Área</label>
                <select value={area} onChange={(e) => setArea(e.target.value as GoalArea)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:h-10">
                  {GOAL_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor alvo</label>
                <Input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} type="number" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prazo</label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <Button onClick={addGoal} className="w-full">Criar meta</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
