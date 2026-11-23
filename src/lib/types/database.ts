type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: Relationship[];
};

type GenericView = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: Relationship[];
} | {
  Row: Record<string, unknown>;
  Relationships: Relationship[];
};

type GenericFunction = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
  SetofOptions?: unknown;
};

type GenericSchemaType = {
  Tables: Record<string, GenericTable>;
  Views: Record<string, GenericView>;
  Functions: Record<string, GenericFunction>;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export type Client = {
  id: string;
  user_id: string;
  name: string;
  fantasy_name: string | null;
  type: "PF" | "PJ";
  cpf_cnpj: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  segment: string | null;
  lead_source: string | null;
  status: "Lead" | "Ativo" | "Pausado" | "Encerrado";
  notes: string | null;
  started_at: string | null;
  owner_contact_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientInsert = Partial<Omit<Client, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type ClientUpdate = Partial<Client>;

export type ClientContact = {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};
export type ClientContactInsert = Partial<Omit<ClientContact, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type ClientContactUpdate = Partial<ClientContact>;

export type Interaction = {
  id: string;
  user_id: string;
  client_id: string;
  deal_id: string | null;
  type: "Ligação" | "WhatsApp" | "E-mail" | "Reunião" | "Nota";
  summary: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
};
export type InteractionInsert = Partial<Omit<Interaction, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type InteractionUpdate = Partial<Interaction>;

export type Deal = {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  stage_id: string;
  value: number | null;
  probability: number | null;
  expected_close_at: string | null;
  source: string | null;
  next_step: string | null;
  next_step_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
};
export type DealInsert = Partial<Omit<Deal, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type DealUpdate = Partial<Deal>;

export type PipelineStage = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
};
export type PipelineStageInsert = Partial<Omit<PipelineStage, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type PipelineStageUpdate = Partial<PipelineStage>;

export type Contract = {
  id: string;
  user_id: string;
  client_id: string;
  description: string | null;
  total_value: number;
  type: "Projeto fechado" | "Recorrente mensal" | "Hora";
  service_type:
    | "Site institucional"
    | "E-commerce"
    | "Landing page"
    | "Identidade visual"
    | "Consultoria"
    | "Tráfego pago"
    | "Outro";
  installments_count: number;
  first_installment_at: string;
  frequency: "Mensal" | "Anual" | "Único" | null;
  payment_method: "PIX" | "Boleto" | "Cartão" | "Transferência" | null;
  status: "Em andamento" | "Concluído" | "Cancelado";
  created_at: string;
  updated_at: string;
};
export type ContractInsert = Partial<Omit<Contract, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type ContractUpdate = Partial<Contract>;

export type InvestmentClass = "Ações" | "FIIs" | "Renda fixa";

export type InvestmentPosition = {
  id: string;
  user_id: string;
  ticker: string;
  name: string;
  asset_class: InvestmentClass;
  quantity: number;
  average_price: number;
  current_price: number | null;
  price_as_of: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InvestmentPositionInsert = {
  user_id: string;
  ticker: string;
  name: string;
  asset_class: InvestmentClass;
  quantity: number;
  average_price: number;
  current_price?: number | null;
  price_as_of?: string | null;
  is_active?: boolean;
};

export type InvestmentPositionUpdate = Partial<InvestmentPosition>;

export type Installment = {
  id: string;
  user_id: string;
  contract_id: string;
  number: number;
  value: number;
  due_at: string;
  status: "Pendente" | "Paga" | "Atrasada" | "Cancelada";
  paid_at: string | null;
  paid_value: number | null;
  payment_method: "PIX" | "Boleto" | "Cartão" | "Transferência" | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};
export type InstallmentInsert = Partial<Omit<Installment, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type InstallmentUpdate = Partial<Installment>;

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: "Conta corrente" | "Cartão" | "Dinheiro" | "Investimentos";
  balance: number;
  color: string | null;
  created_at: string;
  updated_at: string;
};
export type AccountInsert = Partial<Omit<Account, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type AccountUpdate = Partial<Account>;

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: "Receita" | "Despesa";
  color: string | null;
  parent_id: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};
export type CategoryInsert = Partial<Omit<Category, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type CategoryUpdate = Partial<Category>;

export type Transaction = {
  id: string;
  user_id: string;
  client_id: string | null;
  category_id: string | null;
  type: "Receita" | "Despesa";
  amount: number;
  date: string;
  context: "PJ" | "Pessoal";
  account_id: string | null;
  payment_method: "PIX" | "Boleto" | "Cartão" | "Transferência" | null;
  recurrence: "Mensal" | "Anual" | null;
  note: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
};
export type TransactionInsert = Partial<Omit<Transaction, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type TransactionUpdate = Partial<Transaction>;

export type Budget = {
  id: string;
  user_id: string;
  category_id: string | null;
  month: string;
  amount: number;
  created_at: string;
  updated_at: string;
};
export type BudgetInsert = Partial<Omit<Budget, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type BudgetUpdate = Partial<Budget>;

export type RecurringItem = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: "Receita" | "Despesa";
  frequency: "Mensal" | "Anual";
  start_date: string;
  next_due_at: string | null;
  category_id: string | null;
  account_id: string | null;
  payment_method: "PIX" | "Boleto" | "Cartão" | "Transferência" | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type RecurringItemInsert = Partial<Omit<RecurringItem, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type RecurringItemUpdate = Partial<RecurringItem>;

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  area: "Financeira" | "Profissional" | "Saúde" | "Estudos" | "Família" | "Pessoal";
  metric: string | null;
  current_value: number | null;
  target_value: number | null;
  unit: string | null;
  deadline: string | null;
  status: "Não iniciada" | "Em andamento" | "Concluída" | "Pausada";
  created_at: string;
  updated_at: string;
};
export type GoalInsert = Partial<Omit<Goal, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type GoalUpdate = Partial<Goal>;

export type GoalMilestone = {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  done: boolean;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};
export type GoalMilestoneInsert = Partial<Omit<GoalMilestone, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type GoalMilestoneUpdate = Partial<GoalMilestone>;

export type GoalReview = {
  id: string;
  user_id: string;
  goal_id: string | null;
  kind: "Semanal" | "Mensal";
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type GoalReviewInsert = Partial<Omit<GoalReview, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type GoalReviewUpdate = Partial<GoalReview>;

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  frequency: "daily" | "weekly" | "times_per_week";
  weekdays: number[] | null;
  target_per_week: number | null;
  target_amount: number | null;
  unit: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};
export type HabitInsert = Partial<Omit<Habit, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type HabitUpdate = Partial<Habit>;

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  value: number;
  created_at: string;
  updated_at: string;
};
export type HabitLogInsert = Partial<Omit<HabitLog, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type HabitLogUpdate = Partial<HabitLog>;

export type Task = {
  id: string;
  user_id: string;
  title: string;
  project_id: string | null;
  client_id: string | null;
  goal_id: string | null;
  priority: "Baixa" | "Média" | "Alta";
  status: "A fazer" | "Fazendo" | "Feito";
  due_at: string | null;
  completed_at: string | null;
  recurrence: "Diária" | "Semanal" | "Mensal" | null;
  created_at: string;
  updated_at: string;
};
export type TaskInsert = Partial<Omit<Task, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type TaskUpdate = Partial<Task>;

export type Project = {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: "Planejamento" | "Em andamento" | "Concluído";
  created_at: string;
  updated_at: string;
};
export type ProjectInsert = Partial<Omit<Project, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type ProjectUpdate = Partial<Project>;

export type Note = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  folder: string | null;
  tag: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
};
export type NoteInsert = Partial<Omit<Note, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type NoteUpdate = Partial<Note>;

export type JournalEntry = {
  id: string;
  user_id: string;
  date: string;
  mood: number | null;
  gratitude_1: string | null;
  gratitude_2: string | null;
  gratitude_3: string | null;
  highlight: string | null;
  created_at: string;
  updated_at: string;
};
export type JournalEntryInsert = Partial<Omit<JournalEntry, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type JournalEntryUpdate = Partial<JournalEntry>;

export type Quote = {
  id: string;
  text: string;
  author: string | null;
  created_at: string;
  updated_at: string;
};
export type QuoteInsert = Partial<Omit<Quote, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type QuoteUpdate = Partial<Quote>;

export type FavoriteQuote = {
  user_id: string;
  quote_id: string;
  created_at: string;
  updated_at: string;
};
export type FavoriteQuoteInsert = Partial<Omit<FavoriteQuote, "created_at" | "updated_at">> & {
  user_id: string;
  quote_id: string;
};
export type FavoriteQuoteUpdate = Partial<FavoriteQuote>;

export type TimeEntry = {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  task_id: string | null;
  minutes: number;
  description: string | null;
  hourly_rate: number | null;
  created_at: string;
  updated_at: string;
};
export type TimeEntryInsert = Partial<Omit<TimeEntry, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type TimeEntryUpdate = Partial<TimeEntry>;

export type Subscription = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: "Mensal" | "Anual";
  category_id: string | null;
  next_billing_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type SubscriptionInsert = Partial<Omit<Subscription, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type SubscriptionUpdate = Partial<Subscription>;

export type ClientAsset = {
  id: string;
  user_id: string;
  client_id: string;
  kind: "Domínio" | "Hospedagem";
  name: string;
  url: string | null;
  renews_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type ClientAssetInsert = Partial<Omit<ClientAsset, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type ClientAssetUpdate = Partial<ClientAsset>;

export type Attachment = {
  id: string;
  user_id: string;
  client_id: string | null;
  bucket: string;
  path: string;
  name: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
  updated_at: string;
};
export type AttachmentInsert = Partial<Omit<Attachment, "id" | "created_at" | "updated_at">> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type AttachmentUpdate = Partial<Attachment>;

export type ClientFinancialSummary = {
  client_id: string;
  contract_count: number;
  contract_value: number;
  paid_value: number;
  pending_value: number;
  installments_paid: number;
  installments_total: number;
};

export type OverdueInstallment = {
  id: string;
  contract_id: string;
  client_id: string;
  number: number;
  value: number;
  due_at: string;
  status: string;
  paid_at: string | null;
  paid_value: number | null;
  payment_method: string | null;
  note: string | null;
};

export type MonthlyCashflow = {
  month: string;
  revenue: number;
  expenses: number;
  balance: number;
};

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: ClientInsert;
        Update: ClientUpdate;
        Relationships: Relationship[];
      };
      client_contacts: {
        Row: ClientContact;
        Insert: ClientContactInsert;
        Update: ClientContactUpdate;
        Relationships: Relationship[];
      };
      investment_positions: {
        Row: InvestmentPosition;
        Insert: InvestmentPositionInsert;
        Update: InvestmentPositionUpdate;
        Relationships: Relationship[];
      };
      interactions: {
        Row: Interaction;
        Insert: InteractionInsert;
        Update: InteractionUpdate;
        Relationships: Relationship[];
      };
      deals: {
        Row: Deal;
        Insert: DealInsert;
        Update: DealUpdate;
        Relationships: Relationship[];
      };
      pipeline_stages: {
        Row: PipelineStage;
        Insert: PipelineStageInsert;
        Update: PipelineStageUpdate;
        Relationships: Relationship[];
      };
      contracts: {
        Row: Contract;
        Insert: ContractInsert;
        Update: ContractUpdate;
        Relationships: Relationship[];
      };
      installments: {
        Row: Installment;
        Insert: InstallmentInsert;
        Update: InstallmentUpdate;
        Relationships: Relationship[];
      };
      accounts: {
        Row: Account;
        Insert: AccountInsert;
        Update: AccountUpdate;
        Relationships: Relationship[];
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: Relationship[];
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
        Relationships: Relationship[];
      };
      budgets: {
        Row: Budget;
        Insert: BudgetInsert;
        Update: BudgetUpdate;
        Relationships: Relationship[];
      };
      recurring_items: {
        Row: RecurringItem;
        Insert: RecurringItemInsert;
        Update: RecurringItemUpdate;
        Relationships: Relationship[];
      };
      goals: {
        Row: Goal;
        Insert: GoalInsert;
        Update: GoalUpdate;
        Relationships: Relationship[];
      };
      goal_milestones: {
        Row: GoalMilestone;
        Insert: GoalMilestoneInsert;
        Update: GoalMilestoneUpdate;
        Relationships: Relationship[];
      };
      goal_reviews: {
        Row: GoalReview;
        Insert: GoalReviewInsert;
        Update: GoalReviewUpdate;
        Relationships: Relationship[];
      };
      habits: {
        Row: Habit;
        Insert: HabitInsert;
        Update: HabitUpdate;
        Relationships: Relationship[];
      };
      habit_logs: {
        Row: HabitLog;
        Insert: HabitLogInsert;
        Update: HabitLogUpdate;
        Relationships: Relationship[];
      };
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: TaskUpdate;
        Relationships: Relationship[];
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: Relationship[];
      };
      notes: {
        Row: Note;
        Insert: NoteInsert;
        Update: NoteUpdate;
        Relationships: Relationship[];
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: JournalEntryInsert;
        Update: JournalEntryUpdate;
        Relationships: Relationship[];
      };
      quotes: {
        Row: Quote;
        Insert: QuoteInsert;
        Update: QuoteUpdate;
        Relationships: Relationship[];
      };
      favorite_quotes: {
        Row: FavoriteQuote;
        Insert: FavoriteQuoteInsert;
        Update: FavoriteQuoteUpdate;
        Relationships: Relationship[];
      };
      time_entries: {
        Row: TimeEntry;
        Insert: TimeEntryInsert;
        Update: TimeEntryUpdate;
        Relationships: Relationship[];
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
        Relationships: Relationship[];
      };
      client_assets: {
        Row: ClientAsset;
        Insert: ClientAssetInsert;
        Update: ClientAssetUpdate;
        Relationships: Relationship[];
      };
      attachments: {
        Row: Attachment;
        Insert: AttachmentInsert;
        Update: AttachmentUpdate;
        Relationships: Relationship[];
      };
    };
    Views: {
      client_financial_summary: {
        Row: ClientFinancialSummary;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: Relationship[];
      };
      overdue_installments: {
        Row: OverdueInstallment;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: Relationship[];
      };
      monthly_cashflow: {
        Row: MonthlyCashflow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: Relationship[];
      };
    };
    Functions: Record<string, GenericFunction>;
  };
};
