"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, monthKey, currentMonthKey, monthLabel, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  BarChart3,
  ClipboardList,
  Dumbbell,
  Heart,
  Hourglass,
  Quote as QuoteIcon,
  Receipt,
  RefreshCw,
  Shuffle,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { addMonths, endOfMonth, startOfMonth, subMonths, format as f, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

const QUOTES = [
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
  { text: "Não espere por oportunidades, crie-as.", author: "George Bernard Shaw" },
  { text: "Foco é fazer as coisas certas. Prioridade é fazer as coisas primeiro.", author: "Stephen Covey" },
  { text: "O fracasso é a oportunidade de começar de novo com mais inteligência.", author: "Henry Ford" },
  { text: "Feito é melhor que perfeito.", author: "Autor desconhecido" },
  { text: "A jornada de mil milhas começa com um único passo.", author: "Lao-Tsé" },
  { text: "A melhor hora para plantar uma árvore foi há 20 anos. A segunda melhor é agora.", author: "Provérbio chinês" },
  { text: "Trabalhe duro em silêncio, deixe o sucesso fazer barulho.", author: "Frank Ocean" },
  { text: "A vida não é sobre encontrar-se. É sobre criar quem você é.", author: "George Bernard Shaw" },
  { text: "Seja a mudança que você quer ver no mundo.", author: "Mahatma Gandhi" },
  { text: "Tudo o que você sempre quis está do outro lado do medo.", author: "George Addair" },
  { text: "A vida é o que acontece enquanto você está ocupado fazendo outros planos.", author: "John Lennon" },
  { text: "O sucesso é tropeçar de fracasso em fracasso sem perder o entusiasmo.", author: "Winston Churchill" },
  { text: "O que não me mata me fortalece.", author: "Friedrich Nietzsche" },
  { text: "Nós somos o que fazemos repetidamente. A excelência, portanto, não é um ato, mas um hábito.", author: "Aristóteles" },
  { text: "Nenhum vento é favorável para quem não sabe para onde navegar.", author: "Sêneca" },
  { text: "O obstáculo é o caminho.", author: "Marco Aurélio" },
  { text: "Não são as coisas que nos perturbam, mas a opinião que temos delas.", author: "Epicteto" },
  { text: "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.", author: "Albert Einstein" },
  { text: "Insanidade é fazer a mesma coisa repetidamente e esperar resultados diferentes.", author: "Albert Einstein" },
  { text: "Não importa o quão devagar você vá, desde que não pare.", author: "Confúcio" },
  { text: "Escolha um trabalho que você ame e você não trabalhará um único dia na sua vida.", author: "Confúcio" },
  { text: "Nossa maior glória não está em nunca cair, mas em levantar toda vez que caímos.", author: "Confúcio" },
  { text: "Conhecer os outros é inteligência; conhecer a si mesmo é sabedoria.", author: "Lao-Tsé" },
  { text: "O segredo para ir em frente é começar.", author: "Mark Twain" },
  { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
  { text: "A única maneira de fazer um ótimo trabalho é amar o que você faz.", author: "Steve Jobs" },
  { text: "Um objetivo sem um plano é apenas um desejo.", author: "Antoine de Saint-Exupéry" },
  { text: "O essencial é invisível aos olhos.", author: "Antoine de Saint-Exupéry" },
  { text: "A vida é como andar de bicicleta. Para manter o equilíbrio, você deve continuar se movendo.", author: "Albert Einstein" },
  { text: "Ninguém pode fazer você se sentir inferior sem o seu consentimento.", author: "Eleanor Roosevelt" },
  { text: "A mente é tudo. Você se torna aquilo que pensa.", author: "Buda" },
  { text: "Não há atalhos para qualquer lugar que valha a pena ir.", author: "Beverly Sills" },
  { text: "As pessoas vão esquecer o que você disse, as pessoas vão esquecer o que você fez, mas elas nunca esquecerão como você as fez sentir.", author: "Maya Angelou" },
  { text: "O amanhã pertence a quem se prepara hoje.", author: "Autor desconhecido" },
  { text: "A vida é uma aventura ousada ou nada.", author: "Helen Keller" },
  { text: "Não conte os dias, faça os dias contarem.", author: "Muhammad Ali" },
  { text: "Impossível é apenas uma opinião.", author: "Muhammad Ali" },
  { text: "Nada substitui o trabalho duro.", author: "Autor desconhecido" },
];

type QuoteItem = { id: string; text: string; author: string | null };

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function todayLongText() {
  const today = new Date();
  const s = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function HomePage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("id, text, author").order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as QuoteItem[];
    },
  });

  const { data: favoriteQuoteIds } = useQuery({
    queryKey: ["favorite-quotes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorite_quotes").select("quote_id").eq("user_id", user!.id);
      if (error) throw error;
      const ids = (data ?? []).map((f) => f.quote_id).filter((x): x is string => Boolean(x));
      return ids;
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ quoteId, favorite }: { quoteId: string; favorite: boolean }) => {
      const userId = user?.id;
      if (!userId) throw new Error("Sessão não encontrada");
      if (favorite) {
        const { error } = await supabase.from("favorite_quotes").insert({ user_id: userId, quote_id: quoteId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorite_quotes").delete().eq("user_id", userId).eq("quote_id", quoteId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-quotes", user?.id] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar favorito", variant: "error" });
    },
  });

  const { data: monthData } = useQuery({
    queryKey: ["transactions-month", currentMonthKey()],
    queryFn: async () => {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const { data } = await supabase
        .from("transactions")
        .select("type, amount")
        .gte("date", f(start, "yyyy-MM-dd"))
        .lte("date", f(end, "yyyy-MM-dd"));
      let revenue = 0;
      let expenses = 0;
      (data ?? []).forEach((t) => {
        if (t.type === "Receita") revenue += t.amount;
        else expenses += t.amount;
      });
      return { revenue, expenses };
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ["transactions-chart-6m"],
    queryFn: async () => {
      const now = new Date();
      const start = startOfMonth(subMonths(now, 5));
      const { data } = await supabase
        .from("transactions")
        .select("type, amount, date")
        .gte("date", f(start, "yyyy-MM-dd"))
        .lte("date", f(endOfMonth(now), "yyyy-MM-dd"));
      const map = new Map<string, { revenue: number; expenses: number }>();
      (data ?? []).forEach((t) => {
        const key = monthKey(t.date);
        const cur = map.get(key) ?? { revenue: 0, expenses: 0 };
        if (t.type === "Receita") cur.revenue += t.amount;
        else cur.expenses += t.amount;
        map.set(key, cur);
      });
      const arr: Array<{ month: string; Receita: number; Despesa: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = addMonths(new Date(), -i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const cur = map.get(key) ?? { revenue: 0, expenses: 0 };
        arr.push({
          month: monthLabel(key).split(" ")[0],
          Receita: cur.revenue,
          Despesa: cur.expenses,
        });
      }
      return arr;
    },
  });

  const { data: receivables } = useQuery({
    queryKey: ["installments-receivables"],
    queryFn: async () => {
      const now = new Date();
      const limit = f(addMonths(now, 1), "yyyy-MM-dd");
      const { data: installments } = await supabase
        .from("installments")
        .select("id, number, value, due_at, status, contract_id")
        .in("status", ["Pendente", "Atrasada"])
        .gte("due_at", f(now, "yyyy-MM-dd"))
        .lte("due_at", limit)
        .order("due_at", { ascending: true });
      const items = (installments ?? []) as Array<{
        id: string;
        number: number;
        value: number;
        due_at: string;
        status: string;
        contract_id: string;
      }>;
      const overdue = items.filter((i) => i.status === "Atrasada");
      const contractIds = Array.from(new Set(items.map((i) => i.contract_id).filter(Boolean)));
      const contracts =
        contractIds.length > 0
          ? ((await supabase.from("contracts").select("id, client_id").in("id", contractIds))).data ?? []
          : [];
      const clientIds = Array.from(
        new Set((contracts ?? []).map((c) => c.client_id).filter(Boolean)),
      ) as string[];
      const clients =
        clientIds.length > 0
          ? ((await supabase.from("clients").select("id, name").in("id", clientIds))).data ?? []
          : [];
      const nameByClientId = new Map((clients ?? []).map((c) => [c.id, c.name]));
      const clientName = (contractId: string) => {
        const contract = (contracts ?? []).find((c) => c.id === contractId);
        if (!contract) return "Cliente";
        return nameByClientId.get(contract.client_id) ?? "Cliente";
      };
      return {
        items: items.map((i) => ({ ...i, client_name: clientName(i.contract_id) })),
        overdue,
        totalDue: items.reduce((acc, i) => acc + i.value, 0),
        overdueTotal: overdue.reduce((acc, i) => acc + i.value, 0),
      };
    },
  });

  const { data: habitsToday } = useQuery({
    queryKey: ["habits-today"],
    queryFn: async () => {
      const today = f(new Date(), "yyyy-MM-dd");
      const { data: habits } = await supabase
        .from("habits")
        .select("*")
        .eq("archived", false);
      const { data: logs } = await supabase.from("habit_logs").select("*");
      const doneIds = new Set(
        (logs ?? []).filter((l) => l.date === today).map((l) => l.habit_id),
      );
      const list = (habits ?? [])
        .filter((h) => h.frequency === "daily" || h.frequency === "weekly")
        .map((h) => ({ ...h, done: doneIds.has(h.id) }));
      return list;
    },
  });

  const { data: tasksToday } = useQuery({
    queryKey: ["tasks-today"],
    queryFn: async () => {
      const today = f(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_at")
        .or(`due_at.eq.${today},status.eq.Fazendo`)
        .order("due_at", { ascending: true })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: goals } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data } = await supabase.from("goals").select("*");
      return data ?? [];
    },
  });

  const dailyQuote = React.useMemo<QuoteItem>(() => {
    const list = quotes ?? [];
    const key = dateKey();
    const h = hashString(key);
    const q = list.length > 0 ? list[Math.abs(h) % list.length] : undefined;
    if (q) return q;
    const f = QUOTES[h % QUOTES.length];
    return { id: `local-${h % QUOTES.length}`, text: f.text, author: f.author };
  }, [quotes]);

  const [otherQuoteId, setOtherQuoteId] = React.useState<string | null>(null);
  const quote: QuoteItem = otherQuoteId ? quotes?.find((q) => q.id === otherQuoteId) ?? dailyQuote : dailyQuote;
  const isFavorite = !!quote && (favoriteQuoteIds?.includes(quote.id) ?? false);

  const pickOtherQuote = () => {
    const pool: QuoteItem[] =
      quotes && quotes.length > 0
        ? quotes
        : QUOTES.map((q, i) => ({ id: `local-${i}`, text: q.text, author: q.author }));
    const others = (pool ?? []).filter((q) => q.id !== quote.id);
    const source = others.length > 0 ? others : pool;
    const next = source[Math.floor(Math.random() * source.length)];
    setOtherQuoteId(next.id);
  };

  const todayHabits = habitsToday ?? [];
  const doneHabits = todayHabits.filter((h) => h.done).length;

  const goalList = (goals ?? []).filter((g) => g.status === "Em andamento");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{greeting()}, Victor</h2>
        <p className="mt-1 text-secondary">{todayLongText()}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <QuoteIcon className="mt-0.5 h-5 w-5 text-tertiary" />
          <div className="min-w-0 flex-1">
            <p className="serif-font text-lg italic text-secondary">“{quote?.text}”</p>
            <p className="mt-1 text-xs text-tertiary">— {quote?.author}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={pickOtherQuote}
                disabled={quotesLoading}
              >
                <Shuffle className="h-3 w-3" /> Outra frase
              </Button>
              {quote && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => toggleFavorite.mutate({ quoteId: quote.id, favorite: !isFavorite })}
                  disabled={toggleFavorite.isPending}
                >
                  <Heart className={`h-3 w-3 ${isFavorite ? "fill-current" : ""}`} />
                  {isFavorite ? "Favorita" : "Favoritar"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Receita do mês"
          value={formatCurrency(monthData?.revenue ?? 0)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Despesas do mês"
          value={formatCurrency(monthData?.expenses ?? 0)}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          label="Saldo do mês"
          value={formatCurrency((monthData?.revenue ?? 0) - (monthData?.expenses ?? 0))}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="A receber · 30 dias"
          value={formatCurrency(receivables?.totalDue ?? 0)}
          hint={`${receivables?.items?.length ?? 0} parcelas · ${formatCurrency(receivables?.overdueTotal ?? 0)} em atraso`}
          icon={<Hourglass className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita x Despesa · últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,53,47,0.09)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "rgba(55,53,47,0.65)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "rgba(55,53,47,0.65)" }} tickFormatter={(v: number) => `R$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(l) => `Mês: ${l}`}
                  />
                  <Bar dataKey="Receita" fill="#2383E2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesa" fill="#EB5757" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[260px] w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-secondary">
                  <Dumbbell className="h-3.5 w-3.5" /> Hábitos de hoje
                </span>
                <span className="font-medium">
                  {doneHabits}/{todayHabits.length} concluídos
                </span>
              </div>
              <ProgressBar
                value={todayHabits.length ? (doneHabits / todayHabits.length) * 100 : 0}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-secondary">
                  <ClipboardList className="h-3.5 w-3.5" /> Tarefas hoje
                </span>
                <span className="font-medium">{tasksToday?.length ?? 0} abertas</span>
              </div>
              <div className="mt-2 space-y-2">
                {(tasksToday ?? []).slice(0, 3).map((t) => (
                  <Link key={t.id} href="/tasks" className="block text-sm hover:underline">
                    <span className="inline-flex items-center gap-1.5">
                      {t.status === "Fazendo" ? (
                        <RefreshCw className="h-3 w-3 text-accent" />
                      ) : (
                        <span className="text-tertiary">•</span>
                      )}
                      {t.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-secondary">
                  <Target className="h-3.5 w-3.5" /> Metas em andamento
                </span>
                <span className="font-medium">{goalList.length}</span>
              </div>
              <div className="mt-2 space-y-2">
                {goalList.slice(0, 3).map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{g.title}</span>
                    <span className="ml-2 text-xs text-secondary">
                      {g.current_value ?? 0}/{g.target_value ?? 0} {g.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximas parcelas a vencer</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/finance">Ver financeiro</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(receivables?.items ?? []).slice(0, 5).map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{i.client_name}</p>
                    <p className="text-xs text-secondary">
                      Parcela {i.number} · vence {formatDate(i.due_at)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(i.value)}</p>
                </div>
              ))}
              {(receivables?.items?.length ?? 0) === 0 && (
                <p className="py-4 text-center text-sm text-secondary">Nenhuma parcela nos próximos 30 dias.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Metas ativas</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/goals">Ver metas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalList.length === 0 && (
              <p className="py-4 text-center text-sm text-secondary">Nenhuma meta ativa no momento.</p>
            )}
            {goalList.map((g) => {
              const pct = g.target_value ? Math.min(100, ((g.current_value ?? 0) / (g.target_value ?? 1)) * 100) : 0;
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{g.title}</span>
                    <span className="ml-2 text-xs text-secondary">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
