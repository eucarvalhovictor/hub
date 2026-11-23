import type * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, hint, icon, trend = "neutral" }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="text-xs font-medium leading-tight text-secondary">{label}</p>
        {icon && <span className="shrink-0 text-tertiary">{icon}</span>}
      </div>
      <p className="mt-2 break-words text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 line-clamp-2 text-xs text-tertiary">{hint}</p>}
      {trend !== "neutral" && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            trend === "up" ? "text-success" : "text-danger",
          )}
        >
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          em relação ao período
        </p>
      )}
    </div>
  );
}
