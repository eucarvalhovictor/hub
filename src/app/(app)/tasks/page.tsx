"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusSelect } from "@/components/ui/status-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
import { ClipboardList, Plus } from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES, type TaskStatus, type TaskPriority } from "@/lib/constants";
import { DndContext, closestCorners, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  user_id: string;
  title: string;
  project_id: string | null;
  client_id: string | null;
  goal_id: string | null;
  priority: "Baixa" | "Média" | "Alta";
  status: "A fazer" | "Fazendo" | "Feito";
  due_at: string | null;
  completed_at: string | null;
  recurrence: "Diária" | "Semanal" | "Mensal" | null;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
}

function TaskCard({ task, onStatusChange, onPriorityChange }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-md border border-border bg-card p-3 ${isDragging ? "opacity-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      <p className="text-sm font-medium">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
        <StatusSelect
          ariaLabel={`Status de ${task.title}`}
          value={task.status}
          options={TASK_STATUSES}
          onChange={(v) => onStatusChange(task.id, v as TaskStatus)}
        />
        <StatusSelect
          ariaLabel={`Prioridade de ${task.title}`}
          value={task.priority}
          options={TASK_PRIORITIES}
          onChange={(v) => onPriorityChange(task.id, v as TaskPriority)}
        />
        {task.due_at && <span>· {formatDate(task.due_at)}</span>}
        {task.recurrence && <span>· {task.recurrence}</span>}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | "all">("all");
  const [view, setView] = React.useState<"list" | "kanban">("list");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    priority: "Média" as TaskPriority,
    status: "A fazer" as TaskStatus,
    dueAt: "",
    recurrence: "",
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", statusFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase.from("tasks").select("*");
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
      const { data, error } = await query.order("due_at", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const task = (tasks ?? []).find((t) => t.id === active.id);
    const target = (tasks ?? []).find((t) => t.id === over.id);
    if (!task || !target) return;
    const newStatus = target.status;
    if (task.status === newStatus) return;
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, completed_at: newStatus === "Feito" ? new Date().toISOString() : null })
      .eq("id", task.id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const updateTaskField = async (
    id: string,
    patch: Partial<Pick<Task, "status" | "priority">>,
  ) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        ...patch,
        ...(patch.status
          ? { completed_at: patch.status === "Feito" ? new Date().toISOString() : null }
          : {}),
      })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar tarefa", variant: "error" });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const createTask = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("tasks").insert({
        user_id: auth.user.id,
        title: form.title.trim(),
        priority: form.priority,
        status: form.status,
        due_at: form.dueAt || null,
        recurrence: (form.recurrence || null) as Task["recurrence"],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-today"] });
      setForm({ title: "", priority: "Média", status: "A fazer", dueAt: "", recurrence: "" });
      setAddOpen(false);
      toast({ title: "Tarefa criada", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao criar tarefa", variant: "error" });
    },
  });

  const columns: TaskStatus[] = ["A fazer", "Fazendo", "Feito"];
  const canSubmit = form.title.trim().length > 0 && !createTask.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tarefas</h2>
          <p className="mt-1 text-secondary">Seus projetos e pendências.</p>
        </div>
        <Button data-new-item onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Nova tarefa
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {(["all", "A fazer", "Fazendo", "Feito"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-secondary hover:bg-muted"
              }`}
            >
              {s === "all" ? "Todas" : s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-md px-2 py-1.5 text-sm ${view === "list" ? "bg-muted font-medium" : "text-secondary"}`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`rounded-md px-2 py-1.5 text-sm ${view === "kanban" ? "bg-muted font-medium" : "text-secondary"}`}
          >
            Kanban
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="Nenhuma tarefa"
          description="Crie tarefas para transformar planos em resultados."
          action={
            <Button size="sm" data-new-item onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Criar tarefa
            </Button>
          }
        />
      ) : view === "list" ? (
        <Card>
          <CardContent className="divide-y divide-border">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5">
                <Checkbox
                  checked={t.status === "Feito"}
                  onCheckedChange={async (checked) => {
                    const { error } = await supabase
                      .from("tasks")
                      .update({
                        status: checked ? "Feito" : "A fazer",
                        completed_at: checked ? new Date().toISOString() : null,
                      })
                      .eq("id", t.id);
                    if (error) throw error;
                    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
                  }}
                  aria-label={t.title}
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${t.status === "Feito" ? "text-secondary line-through" : ""}`}>
                    {t.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusSelect
                      ariaLabel={`Status de ${t.title}`}
                      value={t.status}
                      options={TASK_STATUSES}
                      onChange={(v) => void updateTaskField(t.id, { status: v as TaskStatus })}
                    />
                    <StatusSelect
                      ariaLabel={`Prioridade de ${t.title}`}
                      value={t.priority}
                      options={TASK_PRIORITIES}
                      onChange={(v) => void updateTaskField(t.id, { priority: v as TaskPriority })}
                    />
                    {t.recurrence && <span className="text-xs text-tertiary">{t.recurrence}</span>}
                  </div>
                </div>
                {t.due_at && <span className="text-xs text-secondary">{formatDate(t.due_at)}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col);
              return (
                <div key={col} className="w-[min(20rem,85vw)] shrink-0 snap-start rounded-lg border border-border bg-muted p-3">
                  <p className="mb-3 text-sm font-semibold">{col}</p>
                  <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {colTasks.map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          onStatusChange={(id, status) => void updateTaskField(id, { status })}
                          onPriorityChange={(id, priority) => void updateTaskField(id, { priority })}
                        />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>Crie uma tarefa com prioridade e prazo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="task-title">Título *</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Enviar proposta para o cliente"
              />
            </div>
            <div>
              <Label htmlFor="task-priority">Prioridade</Label>
              <Select
                id="task-priority"
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="task-status">Status</Label>
              <Select
                id="task-status"
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due">Prazo</Label>
              <Input
                id="task-due"
                type="date"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="task-recurrence">Recorrência</Label>
              <Select
                id="task-recurrence"
                value={form.recurrence}
                onValueChange={(v) => setForm({ ...form, recurrence: v })}
              >
                <option value="">Nenhuma</option>
                <option value="Diária">Diária</option>
                <option value="Semanal">Semanal</option>
                <option value="Mensal">Mensal</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={() => createTask.mutate()}>
              {createTask.isPending ? "Salvando…" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
