import * as React from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = {
  default: "bg-muted text-foreground",
  secondary: "bg-muted text-foreground",
  outline: "border border-input text-foreground",
  success: "bg-[#DBEDDB] text-[#1C3829] dark:bg-[#2B593F] dark:text-[#DBEDDB]",
  warning: "bg-[#FADEC9] text-[#49290E] dark:bg-[#8A6B3F] dark:text-[#FADEC9]",
  info: "bg-[#D3E5EF] text-[#183347] dark:bg-[#28456C] dark:text-[#D3E5EF]",
  danger: "bg-[#FFE2DD] text-[#5D1715] dark:bg-[#6E3630] dark:text-[#FFE2DD]",
  neutral: "bg-[#E3E2E0] text-[#32302C] dark:bg-[#3A3A38] dark:text-[#E3E2E0]",
};

export type BadgeVariant = keyof typeof badgeVariants;

const statusVariantMap: Record<string, BadgeVariant> = {
  // Clientes
  Lead: "info",
  Ativo: "success",
  Pausado: "warning",
  Encerrado: "neutral",
  PF: "info",
  PJ: "info",

  // Funil / CRM
  "Contato feito": "info",
  "Reunião/Diagnóstico": "info",
  "Proposta enviada": "warning",
  Negociação: "warning",
  "Fechado (ganho)": "success",
  Fechado: "success",
  Perdido: "danger",

  // Contratos e parcelas
  "Em andamento": "info",
  Concluído: "success",
  Cancelado: "danger",
  Pendente: "neutral",
  Paga: "success",
  Atrasada: "danger",
  Cancelada: "neutral",

  // Tarefas
  "A fazer": "neutral",
  Fazendo: "warning",
  Feito: "success",
  Baixa: "neutral",
  Média: "warning",
  Alta: "danger",
  Diária: "info",
  Semanal: "info",
  Mensal: "info",

  // Metas
  "Não iniciada": "neutral",
  Concluída: "success",
  Pausada: "neutral",

  // Financeiro e investimentos
  Receita: "success",
  Despesa: "danger",
  Ações: "info",
  FIIs: "warning",
  "Renda fixa": "success",

  // Interações
  Ligação: "info",
  WhatsApp: "success",
  "E-mail": "info",
  Reunião: "warning",
  Nota: "neutral",
};

export function getStatusVariant(status: string): BadgeVariant {
  return statusVariantMap[status] ?? "neutral";
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {status}
    </Badge>
  );
}
