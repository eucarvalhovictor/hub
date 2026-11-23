"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPalette } from "@/components/command-palette";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Menu, Search, X } from "lucide-react";

const TITLES: Record<string, string> = {
  "/": "Hoje",
  "/clients": "Clientes",
  "/crm": "CRM",
  "/finance": "Financeiro",
  "/investments": "Investimentos",
  "/habits": "Hábitos",
  "/goals": "Metas",
  "/tasks": "Tarefas",
  "/notes": "Notas",
  "/journal": "Diário",
  "/settings": "Configurações",
};

const GOTO: Record<string, string> = {
  h: "/",
  c: "/clients",
  m: "/crm",
  f: "/finance",
  i: "/investments",
  g: "/goals",
  a: "/habits",
  t: "/tasks",
  n: "/notes",
  d: "/journal",
  s: "/settings",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout> | undefined;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (e.key === "Escape") setMobileOpen(false);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (gPressed) {
        const dest = GOTO[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        gPressed = false;
        return;
      }

      if (e.key.toLowerCase() === "g") {
        gPressed = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(() => {
          gPressed = false;
        }, 1200);
        return;
      }

      if (e.key.toLowerCase() === "c") {
        const el = document.querySelector<HTMLElement>("[data-new-item]");
        if (el) {
          e.preventDefault();
          el.click();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [router]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const title = TITLES[pathname] ?? "Hub";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] overflow-y-auto overscroll-contain bg-sidebar pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 rounded-md p-2.5 text-secondary hover:bg-muted"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar
              mobile
              collapsed={false}
              onToggleCollapse={() => undefined}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
      <main
        className={cn(
          "min-h-dvh transition-[padding] duration-150",
          collapsed ? "md:pl-16" : "md:pl-sidebar",
        )}
      >
        <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-2 border-b border-border bg-background/80 px-2 pt-[env(safe-area-inset-top)] backdrop-blur sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="m-1 rounded-md p-2 text-secondary hover:bg-muted md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Buscar"
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm text-secondary transition-colors hover:bg-muted sm:px-3 sm:py-1.5"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="hidden flex-1 text-left lg:inline">Buscar…</span>
              <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-tertiary lg:inline-block">
                Ctrl K
              </kbd>
            </button>
            <ThemeToggle />
            <Avatar name="VC" className="h-8 w-8" />
          </div>
        </header>
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:pt-8 md:px-16">{children}</div>
      </main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
