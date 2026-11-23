"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BookHeart,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Home,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_SECTIONS: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "Gestoria",
    items: [
      { label: "Hoje", href: "/", icon: Home },
      { label: "Clientes", href: "/clients", icon: Users },
      { label: "CRM", href: "/crm", icon: Handshake },
      { label: "Financeiro", href: "/finance", icon: Wallet },
    ],
  },
  {
    section: "Vida & crescimento",
    items: [
      { label: "Investimentos", href: "/investments", icon: TrendingUp },
      { label: "Metas", href: "/goals", icon: Target },
      { label: "Hábitos", href: "/habits", icon: CheckCircle2 },
      { label: "Tarefas", href: "/tasks", icon: ClipboardList },
      { label: "Notas", href: "/notes", icon: NotebookPen },
      { label: "Diário", href: "/journal", icon: BookHeart },
    ],
  },
  {
    section: "Sistema",
    items: [{ label: "Configurações", href: "/settings", icon: Settings }],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobile = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={cn(
        "border-r border-border bg-sidebar text-sidebar-foreground",
        mobile
          ? "h-full w-full"
          : "fixed left-0 top-0 z-40 hidden h-dvh transition-[width] duration-150 ease-out md:block",
        !mobile && (collapsed ? "w-16" : "w-sidebar"),
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 px-3">
          <Avatar name="VC" className="h-8 w-8" />
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">Victor</span>
              <span className="truncate text-xs text-secondary">Agência</span>
            </div>
          )}
        </div>
        <nav className="mt-4 flex-1 overflow-y-auto px-2 pb-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.section} className="mb-6">
              {!collapsed && (
                <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-tertiary">
                  {section.section}
                </p>
              )}
              {section.items.map((item) => (
                <Tooltip key={item.href + item.label} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex min-h-10 items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                        collapsed ? "justify-center" : "px-2",
                        isActive(item.href)
                          ? "bg-muted font-medium text-foreground"
                          : "text-secondary hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side={collapsed ? "right" : "top"}>{item.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </nav>
        {!mobile && (
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-secondary transition-colors hover:bg-muted hover:text-foreground",
                collapsed && "justify-center",
              )}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4 shrink-0" />
              ) : (
                <PanelLeftClose className="h-4 w-4 shrink-0" />
              )}
              {!collapsed && <span>Recolher</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
