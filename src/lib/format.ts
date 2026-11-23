import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "R$ 0,00";
  return brlFormatter.format(value);
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "R$ 0";
  return brlFormatter.format(value).replace(/\s/g, " ").replace(",00", ",");
}

export function formatQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0%";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value * 100)}%`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = iso.length === 10 ? parseISO(iso) : new Date(iso);
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = iso.length === 10 ? parseISO(iso) : new Date(iso);
    return format(d, "dd/MM/yyyy, HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "—";
  try {
    const d = iso.length === 10 ? parseISO(iso) : new Date(iso);
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const abs = Math.abs(diffDays);
    const text = abs === 0 ? "hoje" : abs === 1 ? "1 dia" : `${abs} dias`;
    if (diffDays > 0) return `em ${text}`;
    if (diffDays < 0) return diffDays === -1 ? "1 dia atrás" : `${-diffDays} dias atrás`;
    return "hoje";
  } catch {
    return iso;
  }
}

export function monthKey(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? parseISO(iso) : new Date(iso));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return format(d, "MMM yyyy", { locale: ptBR });
}

export function currentMonthKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}
