"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        if (!cancelled) setResults([]);
        return;
      }
      // Busca simples via Supabase client (RLS filtra por usuário)
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const [clientsRes, dealsRes, tasksRes, notesRes] = await Promise.all([
        supabase.from("clients").select("id, name").ilike("name", q).limit(4),
        supabase.from("deals").select("id, title").ilike("title", q).limit(4),
        supabase.from("tasks").select("id, title").ilike("title", q).limit(4),
        supabase.from("notes").select("id, title").ilike("title", q).limit(4),
      ]);
      if (cancelled) return;
      const mapped: SearchResult[] = [
        ...(clientsRes.data ?? []).map((c) => ({
          id: c.id,
          type: "Cliente",
          title: c.name,
          subtitle: "Cliente",
        })),
        ...(dealsRes.data ?? []).map((d) => ({
          id: d.id,
          type: "CRM",
          title: d.title,
          subtitle: "Negociação",
        })),
        ...(tasksRes.data ?? []).map((t) => ({
          id: t.id,
          type: "Tarefa",
          title: t.title,
          subtitle: "Tarefa",
        })),
        ...(notesRes.data ?? []).map((n) => ({
          id: n.id,
          type: "Nota",
          title: n.title ?? "(sem título)",
          subtitle: "Nota",
        })),
      ];
      setResults(mapped.slice(0, 10));
    }
    run().catch(() => setResults([]));
    return () => {
      cancelled = true;
    };
  }, [query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  const goTo = (r: SearchResult) => {
    onOpenChange(false);
    if (r.type === "Cliente") router.push(`/clients/${r.id}`);
    else if (r.type === "CRM") router.push("/crm");
    else if (r.type === "Tarefa") router.push("/tasks");
    else if (r.type === "Nota") router.push(`/notes?focus=${r.id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      goTo(results[activeIndex]);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[max(1rem,env(safe-area-inset-top))] max-h-[85dvh] max-w-xl translate-y-0 gap-2 overflow-y-auto overscroll-contain">
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar clientes, oportunidades, tarefas…"
            className="pl-9"
          />
        </div>
        {results.length > 0 && (
          <div className="mt-2 max-h-[min(20rem,55dvh)] overflow-y-auto overscroll-contain">
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => goTo(r)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                  i === activeIndex ? "bg-muted" : ""
                }`}
              >
                <span className="text-xs font-medium text-tertiary uppercase">{r.type}</span>
                <span className="flex-1 truncate font-medium">{r.title}</span>
                {r.subtitle && <span className="text-xs text-secondary">{r.subtitle}</span>}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
