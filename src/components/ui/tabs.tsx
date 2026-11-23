"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  const [current, setCurrent] = React.useState(value);
  const ctx = React.useMemo<TabsContextValue>(
    () => ({
      value: current,
      onValueChange: (v) => {
        setCurrent(v);
        onValueChange(v);
      },
    }),
    [current, onValueChange],
  );
  return <TabsContext.Provider value={ctx}>{children}</TabsContext.Provider>;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsList deve estar dentro de Tabs");
  return (
    <div
      className={cn(
        "flex h-auto w-full max-w-full gap-1 overflow-x-auto overscroll-x-contain rounded-lg bg-muted p-1 text-muted-foreground sm:inline-flex sm:h-9 sm:w-auto [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger deve estar dentro de Tabs");
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 sm:py-1.5",
        active
          ? "bg-background text-foreground shadow"
          : "text-muted-foreground hover:bg-background/50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
