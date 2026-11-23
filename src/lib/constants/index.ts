export const APP_NAME = "Hub";

export const CLIENT_STATUSES = ["Lead", "Ativo", "Pausado", "Encerrado"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_TYPES = ["PF", "PJ"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const DEAL_STAGES = [
  "Lead",
  "Contato feito",
  "Reunião/Diagnóstico",
  "Proposta enviada",
  "Negociação",
  "Fechado (ganho)",
  "Perdido",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const PIPELINE_OPEN_STAGE_ID = "open";

export const TASK_STATUSES = ["A fazer", "Fazendo", "Feito"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["Baixa", "Média", "Alta"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const GOAL_AREAS = [
  "Financeira",
  "Profissional",
  "Saúde",
  "Estudos",
  "Família",
  "Pessoal",
] as const;
export type GoalArea = (typeof GOAL_AREAS)[number];

export const GOAL_STATUSES = [
  "Não iniciada",
  "Em andamento",
  "Concluída",
  "Pausada",
] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const CONTRACT_STATUSES = ["Em andamento", "Concluído", "Cancelado"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const INSTALLMENT_STATUSES = ["Pendente", "Paga", "Atrasada", "Cancelada"] as const;
export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["PIX", "Boleto", "Cartão", "Transferência"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CONTRACT_SERVICE_TYPES = [
  "Site institucional",
  "E-commerce",
  "Landing page",
  "Identidade visual",
  "Consultoria",
  "Tráfego pago",
  "Outro",
] as const;
export type ContractServiceType = (typeof CONTRACT_SERVICE_TYPES)[number];

export const INVESTMENT_CLASSES = ["Ações", "FIIs", "Renda fixa"] as const;
export type InvestmentClass = (typeof INVESTMENT_CLASSES)[number];

export const TRANSACTION_TYPES = ["Receita", "Despesa"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const ACCOUNT_TYPES = [
  "Conta corrente",
  "Cartão",
  "Dinheiro",
  "Investimentos",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const INTERACTION_TYPES = ["Ligação", "WhatsApp", "E-mail", "Reunião", "Nota"] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const RECENCYENCES = ["Diária", "Semanal", "Mensal"] as const;
export type Recurrence = (typeof RECENCYENCES)[number];

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "Receita" | "Despesa";
  color: string;
}> = [
  { name: "Moradia", type: "Despesa", color: "#FADEC9" },
  { name: "Alimentação", type: "Despesa", color: "#FDECC8" },
  { name: "Saúde", type: "Despesa", color: "#DBEDDB" },
  { name: "Lazer", type: "Despesa", color: "#E8DEEE" },
  { name: "Educação", type: "Despesa", color: "#D3E5EF" },
  { name: "Ferramentas/SaaS", type: "Despesa", color: "#EEE0DA" },
  { name: "Impostos", type: "Despesa", color: "#FFE2DD" },
  { name: "Marketing", type: "Despesa", color: "#F5E0E9" },
  { name: "Salário/Pró-labore", type: "Despesa", color: "#E3E2E0" },
  { name: "Receita do cliente", type: "Receita", color: "#DBEDDB" },
];

export const TAG_COLORS = [
  "#D3E5EF",
  "#FADEC9",
  "#FDECC8",
  "#DBEDDB",
  "#E8DEEE",
  "#F5E0E9",
  "#FFE2DD",
  "#EEE0DA",
];

export function isClientStatus(value: string): value is ClientStatus {
  return (CLIENT_STATUSES as readonly string[]).includes(value);
}
export function isDealStage(value: string): value is DealStage {
  return (DEAL_STAGES as readonly string[]).includes(value);
}
export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}
export function isGoalArea(value: string): value is GoalArea {
  return (GOAL_AREAS as readonly string[]).includes(value);
}
export function isContractStatus(value: string): value is ContractStatus {
  return (CONTRACT_STATUSES as readonly string[]).includes(value);
}
export function isInstallmentStatus(value: string): value is InstallmentStatus {
  return (INSTALLMENT_STATUSES as readonly string[]).includes(value);
}
export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}
export function isTransactionType(value: string): value is TransactionType {
  return (TRANSACTION_TYPES as readonly string[]).includes(value);
}
export function isAccountType(value: string): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}
export function isInteractionType(value: string): value is InteractionType {
  return (INTERACTION_TYPES as readonly string[]).includes(value);
}
export function isRecurrence(value: string): value is Recurrence {
  return (RECENCYENCES as readonly string[]).includes(value);
}
