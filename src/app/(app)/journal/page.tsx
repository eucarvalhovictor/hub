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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { BookHeart, BookOpen, Heart, Plus, Star } from "lucide-react";

interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  mood: number | null;
  gratitude_1: string | null;
  gratitude_2: string | null;
  gratitude_3: string | null;
  highlight: string | null;
  created_at: string;
  updated_at: string;
}

const MOODS = ["", "Muito ruim", "Ruim", "Ok", "Bom", "Ótimo", "Excelente"];

export default function JournalPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = formatDate(new Date().toISOString());
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_entries").select("*");
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
  });

  const todayEntry = (entries ?? []).find((e) => e.date === todayStr) ?? null;

  const saveEntry = async (values: Partial<JournalEntry>) => {
    const { error } = await supabase.from("journal_entries").upsert(
      {
        user_id: await requireUserId(),
        date: todayStr,
        mood: values.mood ?? null,
        gratitude_1: values.gratitude_1 ?? null,
        gratitude_2: values.gratitude_2 ?? null,
        gratitude_3: values.gratitude_3 ?? null,
        highlight: values.highlight ?? null,
      },
      { onConflict: "user_id,date" },
    );
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["journal"] });
  };

  const [mood, setMood] = React.useState<number>(3);
  const [gratitude, setGratitude] = React.useState(["", "", ""]);
  const [highlight, setHighlight] = React.useState("");

  React.useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood ?? 3);
      setGratitude([
        todayEntry.gratitude_1 ?? "",
        todayEntry.gratitude_2 ?? "",
        todayEntry.gratitude_3 ?? "",
      ]);
      setHighlight(todayEntry.highlight ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntry?.id]);

  const submitJournal = async () => {
    try {
      await saveEntry({ mood, gratitude_1: gratitude[0] || null, gratitude_2: gratitude[1] || null, gratitude_3: gratitude[2] || null, highlight: highlight || null });
      toast({ title: "Diário salvo", variant: "success" });
    } catch {
      toast({ title: "Erro ao salvar diário", variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Diário</h2>
          <p className="mt-1 text-secondary">Como você está se sentindo hoje?</p>
        </div>
        <BookOpen className="h-6 w-6 text-tertiary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoje · {formatDate(todayStr)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Humor</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMood(i)}
                  className={`min-h-10 rounded-md border px-3 py-2 text-sm transition-colors ${
                    mood === i ? "border-primary bg-primary text-primary-foreground" : "border-border text-secondary hover:bg-muted"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gratidão 1</label>
              <Input value={gratitude[0]} onChange={(e) => setGratitude([e.target.value, gratitude[1], gratitude[2]])} placeholder="O que você agradece?" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gratidão 2</label>
              <Input value={gratitude[1]} onChange={(e) => setGratitude([gratitude[0], e.target.value, gratitude[2]])} placeholder="O que você agradece?" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gratidão 3</label>
              <Input value={gratitude[2]} onChange={(e) => setGratitude([gratitude[0], gratitude[1], e.target.value])} placeholder="O que você agradece?" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Destaque do dia</label>
            <Input value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="Um momento bom do dia" />
          </div>
          <Button onClick={submitJournal}>Salvar dia</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Histórico</h3>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (entries ?? []).length === 0 ? (
          <EmptyState
            icon={<BookHeart className="h-5 w-5" />}
            title="Nenhuma entrada"
            description="Registre seu primeiro dia."
          />
        ) : (
          (entries ?? [])
            .slice()
            .reverse()
            .slice(0, 10)
            .map((e) => (
              <Card key={e.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{formatDate(e.date)}</p>
                    {e.mood !== null && <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{MOODS[e.mood]}</span>}
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {e.gratitude_1 && (
                      <p className="flex items-start gap-1.5">
                        <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tertiary" />
                        {e.gratitude_1}
                      </p>
                    )}
                    {e.gratitude_2 && (
                      <p className="flex items-start gap-1.5">
                        <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tertiary" />
                        {e.gratitude_2}
                      </p>
                    )}
                    {e.gratitude_3 && (
                      <p className="flex items-start gap-1.5">
                        <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tertiary" />
                        {e.gratitude_3}
                      </p>
                    )}
                    {e.highlight && (
                      <p className="flex items-start gap-1.5 font-medium">
                        <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tertiary" />
                        {e.highlight}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
