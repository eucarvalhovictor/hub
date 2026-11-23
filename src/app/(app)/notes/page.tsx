"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { NotebookPen, Plus, Search, Trash2 } from "lucide-react";

interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  folder: string | null;
  tag: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [openNoteId, setOpenNoteId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes", search],
    queryFn: async () => {
      let query = supabase.from("notes").select("*");
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }
      const { data, error } = await query.order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });

  const openNote = (notes ?? []).find((n) => n.id === openNoteId) ?? null;

  React.useEffect(() => {
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (focus) setOpenNoteId(focus);
  }, []);

  React.useEffect(() => {
    setEditTitle(openNote?.title ?? "");
    setEditContent(openNote?.content ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNote?.id]);

  const createNote = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("notes")
        .insert({ user_id: auth.user.id, title: "Sem título", content: "" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      setOpenNoteId(id);
      toast({ title: "Nota criada", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao criar nota", variant: "error" });
    },
  });

  const saveNote = useMutation({
    mutationFn: async () => {
      if (!openNote) throw new Error("Nenhuma nota selecionada");
      const { error } = await supabase
        .from("notes")
        .update({
          title: editTitle.trim() || "Sem título",
          content: editContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", openNote.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({ title: "Nota salva", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar nota", variant: "error" });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async () => {
      if (!openNote) return;
      const { error } = await supabase.from("notes").delete().eq("id", openNote.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      setOpenNoteId(null);
      toast({ title: "Nota excluída", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir nota", variant: "error" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notas</h2>
          <p className="mt-1 text-secondary">Ideias, briefings e anotações.</p>
        </div>
        <Button data-new-item onClick={() => createNote.mutate()} disabled={createNote.isPending}>
          <Plus className="h-4 w-4" /> Nova nota
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (!notes || notes.length === 0) ? (
        <EmptyState
          icon={<NotebookPen className="h-5 w-5" />}
          title="Nenhuma nota"
          description="Crie sua primeira nota para organizar ideias."
          action={
            <Button size="sm" data-new-item onClick={() => createNote.mutate()}>
              <Plus className="h-4 w-4" /> Criar nota
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Notas</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar notas…"
                  className="h-11 w-full pl-9 sm:h-8 sm:w-56"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setOpenNoteId(n.id)}
                    className={`block w-full rounded-md p-3 text-left transition-colors hover:bg-muted ${
                      openNoteId === n.id ? "bg-muted" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">{n.title ?? "(sem título)"}</p>
                    {n.content && <p className="mt-0.5 line-clamp-2 text-sm text-secondary">{n.content}</p>}
                    <p className="mt-1 text-xs text-tertiary">{formatDate(n.updated_at)}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
            </CardHeader>
            <CardContent>
              {openNote ? (
                <div className="space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título"
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Comece a escrever… (Markdown)"
                    className="min-h-[320px] font-mono text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-danger hover:text-danger"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </Button>
                    <Button size="sm" onClick={() => saveNote.mutate()} disabled={saveNote.isPending}>
                      {saveNote.isPending ? "Salvando…" : "Salvar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-secondary">Selecione uma nota para editar.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteNote.mutate()}
        title="Excluir nota?"
        description="Essa ação não pode ser desfeita."
        isPending={deleteNote.isPending}
      />
    </div>
  );
}
