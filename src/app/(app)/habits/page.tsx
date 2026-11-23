"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/require-user";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { HabitIcon, HABIT_ICONS } from "@/lib/habit-icons";
import { Plus, Flame, CheckCircle2, Circle } from "lucide-react";
import { format, subWeeks, addWeeks, addDays, isSameDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  frequency: "daily" | "weekly" | "times_per_week";
  weekdays: number[] | null;
  target_per_week: number | null;
  target_amount: number | null;
  unit: string | null;
  archived: boolean;
}

interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  value: number;
}

function streak(logs: HabitLog[], habitId: string): number {
  const set = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.date));
  let streakCount = 0;
  const d = new Date();
  // considera hoje mesmo como dia parcial (streak atual)
  const cursor = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (!set.has(format(cursor, "yyyy-MM-dd"))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(format(cursor, "yyyy-MM-dd"))) {
    streakCount++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streakCount;
}

export default function HabitsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("droplets");
  const [frequency, setFrequency] = React.useState<"daily" | "weekly" | "times_per_week">("daily");
  const [targetAmount, setTargetAmount] = React.useState<string>("");
  const [unit, setUnit] = React.useState("");

  const { data: habits, isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("habits").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Habit[];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["habit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("habit_logs").select("*");
      if (error) throw error;
      return (data ?? []) as HabitLog[];
    },
  });

  const today = format(new Date(), "yyyy-MM-dd");

  const toggleLog = async (habitId: string, value: number) => {
    const existing = (logs ?? []).find((l) => l.habit_id === habitId && l.date === today);
    if (existing) {
      const { error: deleteError } = await supabase.from("habit_logs").delete().eq("id", existing.id);
      if (deleteError) throw deleteError;
    } else {
      const { error } = await supabase.from("habit_logs").insert({
        user_id: await requireUserId(),
        habit_id: habitId,
        date: today,
        value,
      });
      if (error) throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    await queryClient.invalidateQueries({ queryKey: ["habits-today"] });
  };

  const addHabit = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("habits").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id ?? "",
      name: name.trim(),
      emoji: icon,
      frequency,
      target_amount: targetAmount ? Number(targetAmount) : null,
      unit: unit || null,
    });
    if (error) throw error;
    setAddOpen(false);
    setName("");
    setTargetAmount("");
    setUnit("");
    await queryClient.invalidateQueries({ queryKey: ["habits"] });
  };

  const weekDays = React.useMemo(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => {
      const d = format(addWeeks(monday, i), "yyyy-MM-dd");
      const date = new Date(d);
      const label = format(date, "EEE", { locale: ptBR });
      const completed = (logs ?? []).some((l) => l.date === d);
      const isToday = isSameDay(date, new Date());
      return { date: d, label, completed, isToday };
    });
  }, [logs]);

  const heatmapWeeks = React.useMemo(() => {
    const today = new Date();
    const start = startOfWeek(subWeeks(today, 15), { weekStartsOn: 1 });
    const completed = new Set((logs ?? []).map((l) => l.date));
    const weeks: Array<Array<{ date: string; completed: boolean; future: boolean }>> = [];
    for (let w = 0; w < 16; w++) {
      const week: Array<{ date: string; completed: boolean; future: boolean }> = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = format(date, "yyyy-MM-dd");
        week.push({ date: key, completed: completed.has(key), future: date > today });
      }
      weeks.push(week);
    }
    return weeks;
  }, [logs]);

  const activeHabits = (habits ?? []).filter((h) => !h.archived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hábitos</h2>
          <p className="mt-1 text-secondary">Construa consistência, um dia de cada vez.</p>
        </div>
        <Button data-new-item onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Novo hábito
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : activeHabits.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />}
          title="Nenhum hábito ainda"
          description="Crie um hábito para começar a construir sua rotina."
          action={
            <Button size="sm" data-new-item onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Criar hábito
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {activeHabits.map((h) => {
            const streakCount = streak(logs ?? [], h.id);
            const done = (logs ?? []).some((l) => l.habit_id === h.id && l.date === today);
            return (
              <Card key={h.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <HabitIcon value={h.emoji} className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.name}</p>
                    <p className="text-xs text-secondary">
                      {h.frequency === "daily" && "Diário"}
                      {h.frequency === "weekly" && "Dias da semana"}
                      {h.frequency === "times_per_week" &&
                        `Até ${h.target_per_week ?? 1}x por semana`}
                    </p>
                  </div>
                  {h.frequency === "daily" && (
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-tertiary" aria-hidden="true" />
                      <span className="text-sm text-secondary">{streakCount}</span>
                    </div>
                  )}
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggleLog(h.id, h.frequency === "times_per_week" ? 1 : 1)}
                    aria-label={h.name}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Semana atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map((d) => (
              <div
                key={d.date}
                className={`flex flex-col items-center gap-1 rounded-md border p-1 text-[10px] sm:p-2 sm:text-xs ${
                  d.isToday ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <span className="text-tertiary">{d.label}</span>
                {d.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                ) : (
                  <Circle className="h-5 w-5 text-tertiary" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapa de consistência · 16 semanas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={day.date}
                    className={`h-3 w-3 rounded-[2px] ${
                      day.future ? "bg-muted/40" : day.completed ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-tertiary">
            <span>Menos</span>
            <span className="h-3 w-3 rounded-[2px] bg-muted" />
            <span className="h-3 w-3 rounded-[2px] bg-primary/50" />
            <span className="h-3 w-3 rounded-[2px] bg-primary" />
            <span>Mais</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo hábito</DialogTitle>
            <DialogDescription>Crie um hábito para sua rotina.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Beber 2L de água" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="habit-icon">Ícone</label>
                <div className="flex items-center gap-2">
                  <HabitIcon value={icon} className="h-4 w-4 shrink-0 text-primary" />
                  <select
                    id="habit-icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {HABIT_ICONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequência</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as "daily" | "weekly" | "times_per_week")}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Dias da semana</option>
                  <option value="times_per_week">X vezes por semana</option>
                </select>
              </div>
            </div>
            {frequency === "times_per_week" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meta (quantidade)</label>
                  <Input value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unidade</label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="L, km, vezes" />
                </div>
              </div>
            )}
            <Button onClick={addHabit} className="w-full">Criar hábito</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
