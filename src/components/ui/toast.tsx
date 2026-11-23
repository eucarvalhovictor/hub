"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  title?: string;
  description?: string;
  variant: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[100] flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-md border border-border bg-popover p-3 shadow-lg"
            role="status"
          >
            {t.variant === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />}
            {t.variant === "error" && <AlertCircle className="mt-0.5 h-4 w-4 text-danger" />}
            {t.variant === "info" && <Info className="mt-0.5 h-4 w-4 text-primary" />}
            <div className="flex-1">
              {t.title && <p className="text-sm font-medium">{t.title}</p>}
              {t.description && <p className="mt-0.5 text-sm text-secondary">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-m-2 p-2 text-base text-tertiary transition-colors hover:text-foreground"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
