-- ============================================================
-- Hub — SETUP COMPLETO (cole tudo no SQL Editor do Supabase)
-- Execute uma única vez. Idempotente: pode repetir sem duplicar dados.
-- ============================================================

-- 1/2 Schema base, RLS, grants, seeds e trigger inicial

-- ============================================================
-- Hub — Migration inicial
-- Tabelas, enums, RLS, índices, views, triggers e seed
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.client_status_enum as enum ('Lead', 'Ativo', 'Pausado', 'Encerrado');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.client_status as enum ('Lead', 'Ativo', 'Pausado', 'Encerrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.client_type_enum as enum ('PF', 'PJ');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.client_type as enum ('PF', 'PJ');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.contract_status_enum as enum ('Em andamento', 'Concluído', 'Cancelado');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.contract_status as enum ('Em andamento', 'Concluído', 'Cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.installment_status_enum as enum ('Pendente', 'Paga', 'Atrasada', 'Cancelada');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.installment_status as enum ('Pendente', 'Paga', 'Atrasada', 'Cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method_enum as enum ('PIX', 'Boleto', 'Cartão', 'Transferência');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_method as enum ('PIX', 'Boleto', 'Cartão', 'Transferência');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status_enum as enum ('A fazer', 'Fazendo', 'Feito');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_status as enum ('A fazer', 'Fazendo', 'Feito');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority_enum as enum ('Baixa', 'Média', 'Alta');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_priority as enum ('Baixa', 'Média', 'Alta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.goal_area_enum as enum ('Financeira', 'Profissional', 'Saúde', 'Estudos', 'Família', 'Pessoal');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.goal_area as enum ('Financeira', 'Profissional', 'Saúde', 'Estudos', 'Família', 'Pessoal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.goal_status_enum as enum ('Não iniciada', 'Em andamento', 'Concluída', 'Pausada');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.goal_status as enum ('Não iniciada', 'Em andamento', 'Concluída', 'Pausada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_type_enum as enum ('Receita', 'Despesa');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.transaction_type as enum ('Receita', 'Despesa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_type_enum as enum ('Conta corrente', 'Cartão', 'Dinheiro', 'Investimentos');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.account_type as enum ('Conta corrente', 'Cartão', 'Dinheiro', 'Investimentos');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interaction_type_enum as enum ('Ligação', 'WhatsApp', 'E-mail', 'Reunião', 'Nota');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.interaction_type as enum ('Ligação', 'WhatsApp', 'E-mail', 'Reunião', 'Nota');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recurring_frequency_enum as enum ('Mensal', 'Anual');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.recurring_frequency as enum ('Mensal', 'Anual');
exception when duplicate_object then null; end $$;

-- Helper: updated_at automático
create or replace function public.handle_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================ CLIENTS ============================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  fantasy_name text,
  type public.client_type not null default 'PJ',
  cpf_cnpj text,
  email text,
  phone text,
  whatsapp text,
  website text,
  address text,
  city text,
  state text,
  segment text,
  lead_source text,
  status public.client_status not null default 'Lead',
  notes text,
  started_at date,
  owner_contact_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_clients_updated on public.clients;
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.handle_updated_at();

create index if not exists idx_clients_user_id on public.clients(user_id);
create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_clients_user_status on public.clients(user_id, status);

alter table public.clients enable row level security;
drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own" on public.clients for select using (auth.uid() = user_id);
drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own" on public.clients for insert with check (auth.uid() = user_id);
drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own" on public.clients for update using (auth.uid() = user_id);
drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own" on public.clients for delete using (auth.uid() = user_id);

-- ============================ CLIENT CONTACTS ============================
create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  whatsapp text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_client_contacts_updated on public.client_contacts;
create trigger trg_client_contacts_updated before update on public.client_contacts
  for each row execute function public.handle_updated_at();

create index if not exists idx_client_contacts_client on public.client_contacts(client_id);

alter table public.client_contacts enable row level security;
drop policy if exists "client_contacts_select_own" on public.client_contacts;
create policy "client_contacts_select_own" on public.client_contacts for select using (auth.uid() = user_id);
drop policy if exists "client_contacts_insert_own" on public.client_contacts;
create policy "client_contacts_insert_own" on public.client_contacts for insert with check (auth.uid() = user_id);
drop policy if exists "client_contacts_update_own" on public.client_contacts;
create policy "client_contacts_update_own" on public.client_contacts for update using (auth.uid() = user_id);
drop policy if exists "client_contacts_delete_own" on public.client_contacts;
create policy "client_contacts_delete_own" on public.client_contacts for delete using (auth.uid() = user_id);

-- ============================ INTERACTIONS ============================
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  deal_id uuid,
  type public.interaction_type not null,
  summary text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_interactions_client on public.interactions(client_id);
create index if not exists idx_interactions_occurred on public.interactions(occurred_at);

alter table public.interactions enable row level security;
drop policy if exists "interactions_select_own" on public.interactions;
create policy "interactions_select_own" on public.interactions for select using (auth.uid() = user_id);
drop policy if exists "interactions_insert_own" on public.interactions;
create policy "interactions_insert_own" on public.interactions for insert with check (auth.uid() = user_id);
drop policy if exists "interactions_update_own" on public.interactions;
create policy "interactions_update_own" on public.interactions for update using (auth.uid() = user_id);
drop policy if exists "interactions_delete_own" on public.interactions;
create policy "interactions_delete_own" on public.interactions for delete using (auth.uid() = user_id);

-- ============================ PIPELINE STAGES ============================
create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pipeline_stages_user_order on public.pipeline_stages(user_id, sort_order);

alter table public.pipeline_stages enable row level security;
drop policy if exists "pipeline_stages_select_own" on public.pipeline_stages;
create policy "pipeline_stages_select_own" on public.pipeline_stages for select using (auth.uid() = user_id);
drop policy if exists "pipeline_stages_insert_own" on public.pipeline_stages;
create policy "pipeline_stages_insert_own" on public.pipeline_stages for insert with check (auth.uid() = user_id);
drop policy if exists "pipeline_stages_update_own" on public.pipeline_stages;
create policy "pipeline_stages_update_own" on public.pipeline_stages for update using (auth.uid() = user_id);
drop policy if exists "pipeline_stages_delete_own" on public.pipeline_stages;
create policy "pipeline_stages_delete_own" on public.pipeline_stages for delete using (auth.uid() = user_id);

-- ============================ DEALS ============================
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  stage_id uuid not null references public.pipeline_stages(id) on delete cascade,
  value numeric(12,2),
  probability integer,
  expected_close_at date,
  source text,
  next_step text,
  next_step_at date,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deals_user_stage on public.deals(user_id, stage_id);
create index if not exists idx_deals_expected_close on public.deals(expected_close_at);

alter table public.deals enable row level security;
drop policy if exists "deals_select_own" on public.deals;
create policy "deals_select_own" on public.deals for select using (auth.uid() = user_id);
drop policy if exists "deals_insert_own" on public.deals;
create policy "deals_insert_own" on public.deals for insert with check (auth.uid() = user_id);
drop policy if exists "deals_update_own" on public.deals;
create policy "deals_update_own" on public.deals for update using (auth.uid() = user_id);
drop policy if exists "deals_delete_own" on public.deals;
create policy "deals_delete_own" on public.deals for delete using (auth.uid() = user_id);

-- ============================ CONTRACTS ============================
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  description text,
  total_value numeric(12,2) not null default 0,
  type text not null default 'Projeto fechado',
  installments_count integer not null default 1,
  first_installment_at date not null default now(),
  frequency text,
  payment_method public.payment_method,
  status public.contract_status not null default 'Em andamento',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contracts_client on public.contracts(client_id);
create index if not exists idx_contracts_status on public.contracts(status);

alter table public.contracts enable row level security;
drop policy if exists "contracts_select_own" on public.contracts;
create policy "contracts_select_own" on public.contracts for select using (auth.uid() = user_id);
drop policy if exists "contracts_insert_own" on public.contracts;
create policy "contracts_insert_own" on public.contracts for insert with check (auth.uid() = user_id);
drop policy if exists "contracts_update_own" on public.contracts;
create policy "contracts_update_own" on public.contracts for update using (auth.uid() = user_id);
drop policy if exists "contracts_delete_own" on public.contracts;
create policy "contracts_delete_own" on public.contracts for delete using (auth.uid() = user_id);

-- ============================ INSTALLMENTS ============================
create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  number integer not null default 1,
  value numeric(12,2) not null default 0,
  due_at date not null,
  status public.installment_status not null default 'Pendente',
  paid_at timestamptz,
  paid_value numeric(12,2),
  payment_method public.payment_method,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_installments_contract on public.installments(contract_id);
create index if not exists idx_installments_due_status on public.installments(due_at, status);
create index if not exists idx_installments_user_status on public.installments(user_id, status);

alter table public.installments enable row level security;
drop policy if exists "installments_select_own" on public.installments;
create policy "installments_select_own" on public.installments for select using (auth.uid() = user_id);
drop policy if exists "installments_insert_own" on public.installments;
create policy "installments_insert_own" on public.installments for insert with check (auth.uid() = user_id);
drop policy if exists "installments_update_own" on public.installments;
create policy "installments_update_own" on public.installments for update using (auth.uid() = user_id);
drop policy if exists "installments_delete_own" on public.installments;
create policy "installments_delete_own" on public.installments for delete using (auth.uid() = user_id);

-- ============================ ACCOUNTS ============================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.account_type not null,
  balance numeric(14,2) not null default 0,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_accounts_user on public.accounts(user_id);

alter table public.accounts enable row level security;
drop policy if exists "accounts_select_own" on public.accounts;
create policy "accounts_select_own" on public.accounts for select using (auth.uid() = user_id);
drop policy if exists "accounts_insert_own" on public.accounts;
create policy "accounts_insert_own" on public.accounts for insert with check (auth.uid() = user_id);
drop policy if exists "accounts_update_own" on public.accounts;
create policy "accounts_update_own" on public.accounts for update using (auth.uid() = user_id);
drop policy if exists "accounts_delete_own" on public.accounts;
create policy "accounts_delete_own" on public.accounts for delete using (auth.uid() = user_id);

-- ============================ CATEGORIES ============================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.transaction_type not null,
  color text,
  parent_id uuid,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_user on public.categories(user_id);

alter table public.categories enable row level security;
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id);
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

-- ============================ TRANSACTIONS ============================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14,2) not null,
  date date not null,
  context text not null default 'PJ',
  account_id uuid references public.accounts(id) on delete set null,
  payment_method public.payment_method,
  recurrence public.recurring_frequency,
  note text,
  attachment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date on public.transactions(user_id, date);
create index if not exists idx_transactions_user_type on public.transactions(user_id, type);

alter table public.transactions enable row level security;
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id);
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

-- ============================ BUDGETS ============================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  month date not null,
  amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_budgets_user_month on public.budgets(user_id, month);

alter table public.budgets enable row level security;
drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own" on public.budgets for select using (auth.uid() = user_id);
drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own" on public.budgets for insert with check (auth.uid() = user_id);
drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own" on public.budgets for update using (auth.uid() = user_id);
drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own" on public.budgets for delete using (auth.uid() = user_id);

-- ============================ RECURRING ITEMS ============================
create table if not exists public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null,
  type public.transaction_type not null,
  frequency public.recurring_frequency not null,
  start_date date not null,
  next_due_at date,
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  payment_method public.payment_method,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recurring_user on public.recurring_items(user_id);

alter table public.recurring_items enable row level security;
drop policy if exists "recurring_select_own" on public.recurring_items;
create policy "recurring_select_own" on public.recurring_items for select using (auth.uid() = user_id);
drop policy if exists "recurring_insert_own" on public.recurring_items;
create policy "recurring_insert_own" on public.recurring_items for insert with check (auth.uid() = user_id);
drop policy if exists "recurring_update_own" on public.recurring_items;
create policy "recurring_update_own" on public.recurring_items for update using (auth.uid() = user_id);
drop policy if exists "recurring_delete_own" on public.recurring_items;
create policy "recurring_delete_own" on public.recurring_items for delete using (auth.uid() = user_id);

-- ============================ GOALS ============================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  area public.goal_area not null,
  metric text,
  current_value numeric,
  target_value numeric,
  unit text,
  deadline date,
  status public.goal_status not null default 'Não iniciada',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_user_status on public.goals(user_id, status);

alter table public.goals enable row level security;
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals for select using (auth.uid() = user_id);
drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals for insert with check (auth.uid() = user_id);
drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals for update using (auth.uid() = user_id);
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals for delete using (auth.uid() = user_id);

-- ============================ GOAL MILESTONES ============================
create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goal_milestones_goal on public.goal_milestones(goal_id);

alter table public.goal_milestones enable row level security;
drop policy if exists "goal_milestones_select_own" on public.goal_milestones;
create policy "goal_milestones_select_own" on public.goal_milestones for select using (auth.uid() = user_id);
drop policy if exists "goal_milestones_insert_own" on public.goal_milestones;
create policy "goal_milestones_insert_own" on public.goal_milestones for insert with check (auth.uid() = user_id);
drop policy if exists "goal_milestones_update_own" on public.goal_milestones;
create policy "goal_milestones_update_own" on public.goal_milestones for update using (auth.uid() = user_id);
drop policy if exists "goal_milestones_delete_own" on public.goal_milestones;
create policy "goal_milestones_delete_own" on public.goal_milestones for delete using (auth.uid() = user_id);

-- ============================ GOAL REVIEWS ============================
create table if not exists public.goal_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  kind text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goal_reviews_user on public.goal_reviews(user_id);

alter table public.goal_reviews enable row level security;
drop policy if exists "goal_reviews_select_own" on public.goal_reviews;
create policy "goal_reviews_select_own" on public.goal_reviews for select using (auth.uid() = user_id);
drop policy if exists "goal_reviews_insert_own" on public.goal_reviews;
create policy "goal_reviews_insert_own" on public.goal_reviews for insert with check (auth.uid() = user_id);
drop policy if exists "goal_reviews_update_own" on public.goal_reviews;
create policy "goal_reviews_update_own" on public.goal_reviews for update using (auth.uid() = user_id);
drop policy if exists "goal_reviews_delete_own" on public.goal_reviews;
create policy "goal_reviews_delete_own" on public.goal_reviews for delete using (auth.uid() = user_id);

-- ============================ HABITS ============================
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text,
  frequency text not null default 'daily',
  weekdays integer[],
  target_per_week integer,
  target_amount numeric,
  unit text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_habits_user_archived on public.habits(user_id, archived);

alter table public.habits enable row level security;
drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id);
drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

-- ============================ HABIT LOGS ============================
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index if not exists idx_habit_logs_habit_date on public.habit_logs(habit_id, date);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);

alter table public.habit_logs enable row level security;
drop policy if exists "habit_logs_select_own" on public.habit_logs;
create policy "habit_logs_select_own" on public.habit_logs for select using (auth.uid() = user_id);
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own" on public.habit_logs for insert with check (auth.uid() = user_id);
drop policy if exists "habit_logs_update_own" on public.habit_logs;
create policy "habit_logs_update_own" on public.habit_logs for update using (auth.uid() = user_id);
drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_delete_own" on public.habit_logs for delete using (auth.uid() = user_id);

-- ============================ PROJECTS ============================
-- Criado antes de tasks: tasks.project_id referencia projects.id.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'Planejamento',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user on public.projects(user_id);

alter table public.projects enable row level security;
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id);
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);

-- ============================ TASKS ============================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  priority public.task_priority not null default 'Média',
  status public.task_status not null default 'A fazer',
  due_at date,
  completed_at timestamptz,
  recurrence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_user_status on public.tasks(user_id, status);
create index if not exists idx_tasks_due on public.tasks(due_at);

alter table public.tasks enable row level security;
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id);
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

-- ============================ NOTES ============================
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  folder text,
  tag text,
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notes_user_updated on public.notes(user_id, updated_at);

alter table public.notes enable row level security;
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes for update using (auth.uid() = user_id);
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);

-- ============================ JOURNAL ============================
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mood integer,
  gratitude_1 text,
  gratitude_2 text,
  gratitude_3 text,
  highlight text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_journal_user_date on public.journal_entries(user_id, date);

alter table public.journal_entries enable row level security;
drop policy if exists "journal_select_own" on public.journal_entries;
create policy "journal_select_own" on public.journal_entries for select using (auth.uid() = user_id);
drop policy if exists "journal_insert_own" on public.journal_entries;
create policy "journal_insert_own" on public.journal_entries for insert with check (auth.uid() = user_id);
drop policy if exists "journal_update_own" on public.journal_entries;
create policy "journal_update_own" on public.journal_entries for update using (auth.uid() = user_id);
drop policy if exists "journal_delete_own" on public.journal_entries;
create policy "journal_delete_own" on public.journal_entries for delete using (auth.uid() = user_id);

-- ============================ QUOTES / FAVORITES ============================
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  author text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotes enable row level security;
drop policy if exists "quotes_select_all" on public.quotes;
create policy "quotes_select_all" on public.quotes for select using (true);
drop policy if exists "quotes_insert_admin" on public.quotes;
create policy "quotes_insert_admin" on public.quotes for insert with check (false);

create table if not exists public.favorite_quotes (
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, quote_id)
);

alter table public.favorite_quotes enable row level security;
drop policy if exists "favorite_quotes_select_own" on public.favorite_quotes;
create policy "favorite_quotes_select_own" on public.favorite_quotes for select using (auth.uid() = user_id);
drop policy if exists "favorite_quotes_insert_own" on public.favorite_quotes;
create policy "favorite_quotes_insert_own" on public.favorite_quotes for insert with check (auth.uid() = user_id);
drop policy if exists "favorite_quotes_delete_own" on public.favorite_quotes;
create policy "favorite_quotes_delete_own" on public.favorite_quotes for delete using (auth.uid() = user_id);

-- ============================ TIME ENTRIES ============================
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  minutes integer not null default 0,
  description text,
  hourly_rate numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_time_entries_user on public.time_entries(user_id);

alter table public.time_entries enable row level security;
drop policy if exists "time_entries_select_own" on public.time_entries;
create policy "time_entries_select_own" on public.time_entries for select using (auth.uid() = user_id);
drop policy if exists "time_entries_insert_own" on public.time_entries;
create policy "time_entries_insert_own" on public.time_entries for insert with check (auth.uid() = user_id);
drop policy if exists "time_entries_update_own" on public.time_entries;
create policy "time_entries_update_own" on public.time_entries for update using (auth.uid() = user_id);
drop policy if exists "time_entries_delete_own" on public.time_entries;
create policy "time_entries_delete_own" on public.time_entries for delete using (auth.uid() = user_id);

-- ============================ SUBSCRIPTIONS ============================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null,
  frequency text not null default 'Mensal',
  category_id uuid references public.categories(id) on delete set null,
  next_billing_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own" on public.subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions for update using (auth.uid() = user_id);
drop policy if exists "subscriptions_delete_own" on public.subscriptions;
create policy "subscriptions_delete_own" on public.subscriptions for delete using (auth.uid() = user_id);

-- ============================ CLIENT ASSETS (domínios/hospedagens) ============================
create table if not exists public.client_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  kind text not null,
  name text not null,
  url text,
  renews_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_assets_client on public.client_assets(client_id);

alter table public.client_assets enable row level security;
drop policy if exists "client_assets_select_own" on public.client_assets;
create policy "client_assets_select_own" on public.client_assets for select using (auth.uid() = user_id);
drop policy if exists "client_assets_insert_own" on public.client_assets;
create policy "client_assets_insert_own" on public.client_assets for insert with check (auth.uid() = user_id);
drop policy if exists "client_assets_update_own" on public.client_assets;
create policy "client_assets_update_own" on public.client_assets for update using (auth.uid() = user_id);
drop policy if exists "client_assets_delete_own" on public.client_assets;
create policy "client_assets_delete_own" on public.client_assets for delete using (auth.uid() = user_id);

-- ============================ ATTACHMENTS (Storage) ============================
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  bucket text not null default 'client-assets',
  path text not null,
  name text not null,
  mime_type text,
  size integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_attachments_user on public.attachments(user_id);

alter table public.attachments enable row level security;
drop policy if exists "attachments_select_own" on public.attachments;
create policy "attachments_select_own" on public.attachments for select using (auth.uid() = user_id);
drop policy if exists "attachments_insert_own" on public.attachments;
create policy "attachments_insert_own" on public.attachments for insert with check (auth.uid() = user_id);
drop policy if exists "attachments_update_own" on public.attachments;
create policy "attachments_update_own" on public.attachments for update using (auth.uid() = user_id);
drop policy if exists "attachments_delete_own" on public.attachments;
create policy "attachments_delete_own" on public.attachments for delete using (auth.uid() = user_id);

-- ============================ VIEWS / FUNCTIONS ============================

-- Resumo financeiro por cliente
create or replace view public.client_financial_summary as
select
  c.id as client_id,
  count(co.id) as contract_count,
  coalesce(sum(co.total_value), 0) as contract_value,
  coalesce(sum(i.paid_value), 0) as paid_value,
  coalesce(sum(i.value), 0) as pending_value,
  count(i.id) filter (where i.status = 'Paga') as installments_paid,
  count(i.id) as installments_total
from public.clients c
left join public.contracts co on co.client_id = c.id and co.status <> 'Cancelado'
left join public.installments i on i.contract_id = co.id
group by c.id;

-- Parcelas em atraso
create or replace view public.overdue_installments as
select
  i.id,
  i.contract_id,
  co.client_id,
  i.number,
  i.value,
  i.due_at,
  i.status,
  i.paid_at,
  i.paid_value,
  i.payment_method,
  i.note
from public.installments i
join public.contracts co on co.id = i.contract_id
where i.status in ('Pendente', 'Atrasada')
  and i.due_at < now();

-- Fluxo de caixa mensal
create or replace view public.monthly_cashflow as
select
  to_char(date_trunc('month', t.date), 'yyyy-MM') as month,
  coalesce(sum(t.amount) filter (where t.type = 'Receita'), 0) as revenue,
  coalesce(sum(t.amount) filter (where t.type = 'Despesa'), 0) as expenses,
  coalesce(sum(t.amount) filter (where t.type = 'Receita'), 0) - coalesce(sum(t.amount) filter (where t.type = 'Despesa'), 0) as balance
from public.transactions t
group by date_trunc('month', t.date);

-- Streak de hábitos (função): dias consecutivos com log, contando hoje (parcial) ou ontem
create or replace function public.get_habit_streak(p_habit_id uuid, p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from generate_series(
    (
      select coalesce(
        (select max(l.date) from public.habit_logs l
         where l.habit_id = p_habit_id and l.user_id = p_user_id),
        current_date - 1
      )
    ),
    current_date,
    interval '1 day'
  ) as d
  where exists (
    select 1
    from public.habit_logs l
    where l.habit_id = p_habit_id
      and l.user_id = p_user_id
      and l.date = d::date
  );
$$;

-- Trigger: ao marcar parcela como paga, criar/atualizar transaction de receita
create or replace function public.handle_installment_paid() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'Paga' and (old.status is distinct from 'Paga') then
    insert into public.transactions (
      user_id, client_id, category_id, type, amount, date, context,
      payment_method, note, created_at, updated_at
    ) values (
      new.user_id,
      (select client_id from public.contracts where id = new.contract_id),
      null,
      'Receita',
      coalesce(new.paid_value, new.value),
      coalesce(new.paid_at::date, now()::date),
      'PJ',
      new.payment_method,
      format('Parcela %s/%s', new.number, (select installments_count from public.contracts where id = new.contract_id)),
      now(),
      now()
    );
  end if;
  return new;
end;
$$;

create or replace trigger trg_installments_paid
after update on public.installments
for each row execute function public.handle_installment_paid();

-- ============================ SEED: CATEGORIAS ============================
-- Seeds só rodam se já existir usuário, para não abortar a migration por FK.
insert into public.categories (user_id, name, type, color, is_default)
select u.id, v.name, v.type::public.transaction_type, v.color, true
  from auth.users u
  cross join (values
    ('Moradia','Despesa','#FADEC9'), ('Alimentação','Despesa','#FDECC8'),
    ('Saúde','Despesa','#DBEDDB'), ('Lazer','Despesa','#E8DEEE'),
    ('Educação','Despesa','#D3E5EF'), ('Ferramentas/SaaS','Despesa','#EEE0DA'),
    ('Impostos','Despesa','#FFE2DD'), ('Marketing','Despesa','#F5E0E9'),
    ('Salário/Pró-labore','Despesa','#E3E2E0'), ('Receita do cliente','Receita','#DBEDDB')
  ) as v(name, type, color)
on conflict do nothing;

-- ============================ SEED: ESTÁGIOS DO PIPELINE ============================
insert into public.pipeline_stages (user_id, name, sort_order, is_won, is_lost)
select u.id, v.name, v.sort_order, v.is_won, v.is_lost
  from auth.users u
  cross join (values
    ('Lead',0,false,false), ('Contato feito',1,false,false),
    ('Reunião/Diagnóstico',2,false,false), ('Proposta enviada',3,false,false),
    ('Negociação',4,false,false), ('Fechado (ganho)',5,true,false),
    ('Perdido',6,false,true)
  ) as v(name, sort_order, is_won, is_lost)
on conflict do nothing;

-- ============================ SEED: FRASES MOTIVACIONAIS ============================
insert into public.quotes (text, author) values
  ('O sucesso é a soma de pequenos esforços repetidos dia após dia.', 'Robert Collier'),
  ('Disciplina é a ponte entre metas e realizações.', 'Jim Rohn'),
  ('Não espere por oportunidades, crie-as.', 'George Bernard Shaw'),
  ('O que você faz hoje pode melhorar o seu amanhã.', 'Ralph Marston'),
  ('Foco é fazer as coisas certas. Prioridade é fazer as coisas primeiro.', 'Stephen Covey'),
  ('A constância vence o talento quando o talento não é consistente.', 'Autor desconhecido'),
  ('O fracasso é a oportunidade de começar de novo com mais inteligência.', 'Henry Ford'),
  ('Você não precisa de mais tempo, precisa de foco.', 'Autor desconhecido'),
  ('Feito é melhor que perfeito.', 'Autor desconhecido'),
  ('A jornada de mil milhas começa com um único passo.', 'Lao-Tsé'),
  ('Menos é mais.', 'Ludwig Mies van der Rohe'),
  ('A melhor hora para plantar uma árvore foi há 20 anos. A segunda melhor é agora.', 'Provérbio chinês'),
  ('Disciplina é o que te faz fazer quando ninguém está olhando.', 'Autor desconhecido'),
  ('Acredite em você e tudo será possível.', 'Norman Vincent Peale'),
  ('Trabalhe duro em silêncio, deixe o sucesso fazer barulho.', 'Frank Ocean'),
  ('A vida não é sobre encontrar-se. É sobre criar quem você é.', 'George Bernard Shaw'),
  ('Cada dia é uma nova chance.', 'Autor desconhecido'),
  ('A persistência é o caminho do sucesso.', 'Autor desconhecido'),
  ('Pequenos passos de cada dia criam grandes resultados.', 'Autor desconhecido'),
  ('Acredite no seu potencial, você está mais preparado do que imagina.', 'Autor desconhecido'),
  ('Acredite no processo, o resultado virá.', 'Autor desconhecido'),
  ('Sua única competição é a pessoa que você foi ontem.', 'Autor desconhecido'),
  ('Não desista do seu sonho. Ninguém vai realizá-lo por você.', 'Autor desconhecido'),
  ('A disciplina é o caminho, a motivação é a luz.', 'Autor desconhecido'),
  ('Seja a mudança que você quer ver no mundo.', 'Mahatma Gandhi'),
  ('Tudo o que você sempre quis está do outro lado do medo.', 'George Addair'),
  ('O medo de sofrer é pior do que o sofrimento em si.', 'George Addair'),
  ('O que você faz hoje é o que importa amanhã.', 'Autor desconhecido'),
  ('Você não pode mudar o futuro, mas pode mudar o seu hoje.', 'Autor desconhecido'),
  ('Não é sobre o tamanho do barco, mas sobre a direção das suas velas.', 'Autor desconhecido'),
  ('A vida é o que acontece enquanto você está ocupado fazendo outros planos.', 'John Lennon'),
  ('Faça hoje o que os outros adiam.', 'Autor desconhecido'),
  ('O sucesso é tropeçar de fracasso em fracasso sem perder o entusiasmo.', 'Winston Churchill'),
  ('A persistência é a virtude por excelência.', 'Autor desconhecido'),
  ('Acredite e conquiste.', 'Autor desconhecido'),
  ('Cada fracasso ensina, cada sucesso inspira.', 'Autor desconhecido'),
  ('O importante não é o que você faz, mas como você faz.', 'Autor desconhecido'),
  ('A melhor resposta a um desafio é a ação.', 'Autor desconhecido'),
  ('Todo grande feito é realizado por pessoas que se recusaram a parar.', 'Autor desconhecido'),
  ('O que não me mata me fortalece.', 'Friedrich Nietzsche'),
  ('O risco de não arriscar é maior.', 'Autor desconhecido'),
  ('A jornada mais importante é a que você faz para si mesmo.', 'Autor desconhecido'),
  ('A esperança é o sonho do homem acordado.', 'Aristóteles'),
  ('Nós somos o que fazemos repetidamente. A excelência, portanto, não é um ato, mas um hábito.', 'Aristóteles'),
  ('Conhece-te a ti mesmo.', 'Sócrates'),
  ('Uma vida sem reflexão não merece ser vivida.', 'Sócrates'),
  ('A felicidade depende de nós mesmos.', 'Aristóteles'),
  ('Não é o homem que tem pouco, mas o que deseja mais, que é pobre.', 'Sêneca'),
  ('Enquanto se vive, aprende-se.', 'Sêneca'),
  ('A sorte é o que acontece quando a preparação encontra a oportunidade.', 'Sêneca'),
  ('Nenhum vento é favorável para quem não sabe para onde navegar.', 'Sêneca'),
  ('O obstáculo é o caminho.', 'Marco Aurélio'),
  ('Você tem poder sobre sua mente, não sobre os acontecimentos. Perceba isso e encontrará a força.', 'Marco Aurélio'),
  ('A melhor vingança é não ser como quem te feriu.', 'Marco Aurélio'),
  ('A felicidade da sua vida depende da qualidade dos seus pensamentos.', 'Marco Aurélio'),
  ('Apressa-te a viver bem e pensa que cada dia é, por si só, uma vida.', 'Sêneca'),
  ('Tudo o que ouvimos é uma opinião, não um fato. Tudo o que vemos é uma perspectiva, não a verdade.', 'Marco Aurélio'),
  ('Se você quer melhorar, aceite ser visto como tolo no começo.', 'Epicteto'),
  ('Não são as coisas que nos perturbam, mas a opinião que temos delas.', 'Epicteto'),
  ('Primeiro diga a si mesmo o que você quer ser; depois faça o que precisa ser feito.', 'Epicteto'),
  ('A imaginação é mais importante que o conhecimento.', 'Albert Einstein'),
  ('A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.', 'Albert Einstein'),
  ('Não tente ser uma pessoa de sucesso, mas uma pessoa de valor.', 'Albert Einstein'),
  ('Insanidade é fazer a mesma coisa repetidamente e esperar resultados diferentes.', 'Albert Einstein'),
  ('A medida da inteligência é a capacidade de mudar.', 'Albert Einstein'),
  ('Viva como se fosse morrer amanhã. Aprenda como se fosse viver para sempre.', 'Mahatma Gandhi'),
  ('A força não vem da capacidade física, mas da vontade indomável.', 'Mahatma Gandhi'),
  ('O futuro depende do que você faz hoje.', 'Mahatma Gandhi'),
  ('Primeiro eles te ignoram, depois riem de você, depois lutam contra você, então você vence.', 'Mahatma Gandhi'),
  ('A felicidade não é algo pronto. Ela vem das suas próprias ações.', 'Dalai Lama'),
  ('Se você quer que os outros sejam felizes, pratique a compaixão. Se você quer ser feliz, pratique a compaixão.', 'Dalai Lama'),
  ('O melhor momento para começar é agora.', 'Autor desconhecido'),
  ('Não importa o quão devagar você vá, desde que não pare.', 'Confúcio'),
  ('Escolha um trabalho que você ame e você não trabalhará um único dia na sua vida.', 'Confúcio'),
  ('Nossa maior glória não está em nunca cair, mas em levantar toda vez que caímos.', 'Confúcio'),
  ('O homem que move montanhas começa carregando pequenas pedras.', 'Confúcio'),
  ('Aprender sem pensar é inútil; pensar sem aprender é perigoso.', 'Confúcio'),
  ('Quando a raiva surge, pense nas consequências.', 'Confúcio'),
  ('Conhecer os outros é inteligência; conhecer a si mesmo é sabedoria.', 'Lao-Tsé'),
  ('A água é o mais suave dos elementos, mas penetra a rocha mais dura.', 'Lao-Tsé'),
  ('Quem controla os outros é forte; quem controla a si mesmo é poderoso.', 'Lao-Tsé'),
  ('O silêncio é uma fonte de grande força.', 'Lao-Tsé'),
  ('A simplicidade é a chave para a clareza.', 'Autor desconhecido'),
  ('Não deixe o que você não pode fazer interferir no que você pode fazer.', 'John Wooden'),
  ('O sucesso não é o final, o fracasso não é fatal: é a coragem de continuar que conta.', 'Winston Churchill'),
  ('Nunca, nunca, nunca desista.', 'Winston Churchill'),
  ('Se você está passando pelo inferno, continue.', 'Winston Churchill'),
  ('O pessimista vê dificuldade em cada oportunidade; o otimista vê oportunidade em cada dificuldade.', 'Winston Churchill'),
  ('A coragem é a resistência ao medo, o domínio do medo, não a ausência de medo.', 'Mark Twain'),
  ('Daqui a vinte anos você estará mais decepcionado pelas coisas que não fez do que pelas que fez.', 'Mark Twain'),
  ('O segredo para ir em frente é começar.', 'Mark Twain'),
  ('Nunca permita que a escola interfira na sua educação.', 'Mark Twain'),
  ('A verdade é mais estranha que a ficção, porque a ficção precisa fazer sentido.', 'Mark Twain'),
  ('A melhor maneira de prever o futuro é criá-lo.', 'Peter Drucker'),
  ('O que não é medido não é gerenciado.', 'Peter Drucker'),
  ('A eficiência é fazer as coisas bem; a eficácia é fazer as coisas certas.', 'Peter Drucker'),
  ('O maior perigo em tempos de turbulência não é a turbulência, mas agir com a lógica de ontem.', 'Peter Drucker'),
  ('Não há nada tão inútil quanto fazer com grande eficiência o que não deveria ser feito.', 'Peter Drucker'),
  ('A inovação é o que distingue um líder de um seguidor.', 'Steve Jobs'),
  ('Seu tempo é limitado, não o desperdice vivendo a vida de outra pessoa.', 'Steve Jobs'),
  ('A única maneira de fazer um ótimo trabalho é amar o que você faz.', 'Steve Jobs'),
  ('Fique faminto, fique tolo.', 'Steve Jobs'),
  ('As pessoas que são loucas o suficiente para achar que podem mudar o mundo são as que o fazem.', 'Steve Jobs'),
  ('Design não é apenas como parece e se sente. Design é como funciona.', 'Steve Jobs'),
  ('A qualidade é mais importante que a quantidade.', 'Steve Jobs'),
  ('A liderança e o aprendizado são indispensáveis um ao outro.', 'John F. Kennedy'),
  ('A mudança é a lei da vida. E aqueles que olham apenas para o passado ou o presente perderão o futuro.', 'John F. Kennedy'),
  ('Não pergunte o que seu país pode fazer por você, pergunte o que você pode fazer pelo seu país.', 'John F. Kennedy'),
  ('O sucesso tem muitos pais; o fracasso é órfão.', 'John F. Kennedy'),
  ('Um objetivo sem um plano é apenas um desejo.', 'Antoine de Saint-Exupéry'),
  ('O essencial é invisível aos olhos.', 'Antoine de Saint-Exupéry'),
  ('Fazer da sua vida um sonho, e do sonho uma realidade.', 'Antoine de Saint-Exupéry'),
  ('A perfeição é alcançada não quando não há mais nada a acrescentar, mas quando não há mais nada a retirar.', 'Antoine de Saint-Exupéry'),
  ('O tempo que você perdeu com sua rosa é o que faz sua rosa tão importante.', 'Antoine de Saint-Exupéry'),
  ('A criatividade é a inteligência se divertindo.', 'Albert Einstein'),
  ('A vida é como andar de bicicleta. Para manter o equilíbrio, você deve continuar se movendo.', 'Albert Einstein'),
  ('A única fonte de conhecimento é a experiência.', 'Albert Einstein'),
  ('A educação é o que resta depois que se esquece tudo o que se aprendeu na escola.', 'Albert Einstein'),
  ('O importante é não parar de questionar.', 'Albert Einstein'),
  ('Não é que eu seja tão inteligente, é que fico com os problemas por mais tempo.', 'Albert Einstein'),
  ('A sorte favorece os audazes.', 'Virgílio'),
  ('A audácia tem gênio, poder e magia.', 'Johann Wolfgang von Goethe'),
  ('Saber não é suficiente; devemos aplicar. Querer não é suficiente; devemos fazer.', 'Johann Wolfgang von Goethe'),
  ('Trate as pessoas como se elas fossem o que deveriam ser e você as ajudará a se tornarem o que são capazes de ser.', 'Johann Wolfgang von Goethe'),
  ('Nossa maior fraqueza é desistir. A maneira mais certa de ter sucesso é sempre tentar mais uma vez.', 'Thomas Edison'),
  ('Eu não falhei. Encontrei 10.000 maneiras que não funcionam.', 'Thomas Edison'),
  ('Gênio é um por cento de inspiração e noventa e nove por cento de transpiração.', 'Thomas Edison'),
  ('A oportunidade é perdida pela maioria das pessoas porque ela veste macacão e parece trabalho.', 'Thomas Edison'),
  ('Há duas maneiras de espalhar a luz: ser a vela ou o espelho que a reflete.', 'Edith Wharton'),
  ('Faça o que você pode, com o que você tem, onde você está.', 'Theodore Roosevelt'),
  ('Acredite que você pode e você já está no meio do caminho.', 'Theodore Roosevelt'),
  ('A comparação é a ladra da alegria.', 'Theodore Roosevelt'),
  ('Ninguém pode fazer você se sentir inferior sem o seu consentimento.', 'Eleanor Roosevelt'),
  ('O futuro pertence àqueles que acreditam na beleza de seus sonhos.', 'Eleanor Roosevelt'),
  ('Faça uma coisa que te assuste todos os dias.', 'Eleanor Roosevelt'),
  ('A mente é tudo. Você se torna aquilo que pensa.', 'Buda'),
  ('A paz vem de dentro de você. Não a procure à sua volta.', 'Buda'),
  ('Não importa quantos passos você deu, o importante é o próximo.', 'Buda'),
  ('Cair sete vezes e levantar oito.', 'Provérbio japonês'),
  ('A gratidão transforma o que temos em suficiente.', 'Autor desconhecido'),
  ('A alegria está na luta, na tentativa, no sofrimento envolvido, não na vitória propriamente dita.', 'Mahatma Gandhi'),
  ('Não há atalhos para qualquer lugar que valha a pena ir.', 'Beverly Sills'),
  ('O sucesso é gostar de si mesmo, gostar do que você faz e gostar de como você faz.', 'Maya Angelou'),
  ('Você não pode usar a criatividade. Quanto mais você usa, mais você tem.', 'Maya Angelou'),
  ('As pessoas vão esquecer o que você disse, as pessoas vão esquecer o que você fez, mas elas nunca esquecerão como você as fez sentir.', 'Maya Angelou'),
  ('Nada é impossível, a palavra em si diz "eu sou possível".', 'Audrey Hepburn'),
  ('A beleza de uma pessoa não está nas roupas que ela usa, no corpo que ela carrega ou na forma como ela penteia o cabelo.', 'Audrey Hepburn'),
  ('O amanhã pertence a quem se prepara hoje.', 'Autor desconhecido'),
  ('O primeiro passo para o sucesso é acreditar em si mesmo.', 'Autor desconhecido'),
  ('Você é mais corajoso do que acredita, mais forte do que parece e mais inteligente do que pensa.', 'A.A. Milne'),
  ('A vida é uma aventura ousada ou nada.', 'Helen Keller'),
  ('Sozinhos podemos fazer tão pouco; juntos podemos fazer tanto.', 'Helen Keller'),
  ('O otimismo é a fé que leva à realização.', 'Helen Keller'),
  ('Não conte os dias, faça os dias contarem.', 'Muhammad Ali'),
  ('Impossível é apenas uma opinião.', 'Muhammad Ali'),
  ('Não desista. Sofra agora e viva o resto da sua vida como um campeão.', 'Muhammad Ali'),
  ('É a repetição de afirmações que leva à crença. E uma vez que a crença se torna uma convicção profunda, as coisas começam a acontecer.', 'Muhammad Ali'),
  ('A única pessoa que você deve tentar superar é você mesmo do passado.', 'Autor desconhecido'),
  ('Seja tão bom que não possam te ignorar.', 'Autor desconhecido'),
  ('Trabalhe até que seus ídolos se tornem seus rivais.', 'Autor desconhecido'),
  ('A excelência não é um dom, é uma escolha.', 'Autor desconhecido'),
  ('Nada substitui o trabalho duro.', 'Autor desconhecido'),
  ('O talento ganha jogos, mas o trabalho em equipe ganha campeonatos.', 'Michael Jordan'),
  ('Eu errei mais de 9.000 arremessos na minha carreira. Perdi quase 300 jogos. 26 vezes fui confiado a fazer o arremesso da vitória e errei. Eu falhei repetidamente na minha vida. E é por isso que eu tenho sucesso.', 'Michael Jordan'),
  ('Você pode aceitar o fracasso, mas não pode aceitar não tentar.', 'Michael Jordan')
on conflict do nothing;

-- ============================ STORAGE BUCKET ============================
insert into storage.buckets (id, name, public)
values ('client-assets', 'client-assets', false)
on conflict (id) do nothing;

-- ============================ GRANTS ============================
-- RLS continua aplicando; estes grants apenas liberam o acesso básico da role
-- authenticated (necessário caso o SQL tenha sido executado por role que não
-- herda os default privileges do Supabase).
grant usage on schema public to authenticated, anon, service_role;

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', r.tablename);
    execute format('grant select on public.%I to anon', r.tablename);
    execute format('grant all on public.%I to service_role', r.tablename);
  end loop;
end $$;

grant execute on all functions in schema public to authenticated, service_role;

-- força o PostgREST a recarregar o schema cache
notify pgrst, 'reload schema';


-- 2/2 Investimentos, tipo de serviço e baixa idempotente de parcelas



-- ============================================================
-- Hub — Investimentos pessoais + contratos/parcelas
-- Execute DEPOIS de 20240101000000_init.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Contratos: tipo de serviço prestado
-- ------------------------------------------------------------
do $$ begin
  create type public.contract_service_type as enum (
    'Site institucional', 'E-commerce', 'Landing page',
    'Identidade visual', 'Consultoria', 'Tráfego pago', 'Outro'
  );
exception when duplicate_object then null; end $$;

alter table public.contracts
  add column if not exists service_type public.contract_service_type not null default 'Outro';

-- ------------------------------------------------------------
-- 2. Investimentos: Ações, FIIs e Renda fixa
-- ------------------------------------------------------------
do $$ begin
  create type public.investment_class as enum ('Ações', 'FIIs', 'Renda fixa');
exception when duplicate_object then null; end $$;

create table if not exists public.investment_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  name text not null,
  asset_class public.investment_class not null,
  quantity numeric(18,6) not null default 0,
  average_price numeric(14,6) not null default 0,
  current_price numeric(14,6),
  price_as_of date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint investment_positions_user_ticker_key unique (user_id, ticker),
  constraint investment_positions_ticker_not_blank check (btrim(ticker) <> ''),
  constraint investment_positions_name_not_blank check (btrim(name) <> ''),
  constraint investment_positions_quantity_nonnegative check (quantity >= 0),
  constraint investment_positions_average_price_nonnegative check (average_price >= 0),
  constraint investment_positions_current_price_nonnegative check (current_price is null or current_price >= 0)
);

create index if not exists idx_investment_positions_user_class
  on public.investment_positions (user_id, asset_class);
create index if not exists idx_investment_positions_user_active
  on public.investment_positions (user_id, is_active);

alter table public.investment_positions enable row level security;
drop policy if exists "investment_positions_select_own" on public.investment_positions;
create policy "investment_positions_select_own"
  on public.investment_positions for select using (auth.uid() = user_id);
drop policy if exists "investment_positions_insert_own" on public.investment_positions;
create policy "investment_positions_insert_own"
  on public.investment_positions for insert with check (auth.uid() = user_id);
drop policy if exists "investment_positions_update_own" on public.investment_positions;
create policy "investment_positions_update_own"
  on public.investment_positions for update using (auth.uid() = user_id);
drop policy if exists "investment_positions_delete_own" on public.investment_positions;
create policy "investment_positions_delete_own"
  on public.investment_positions for delete using (auth.uid() = user_id);

drop trigger if exists trg_investment_positions_updated on public.investment_positions;
create trigger trg_investment_positions_updated
  before update on public.investment_positions
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- 3. Parcela paga -> receita no financeiro, de forma idempotente
-- ------------------------------------------------------------
alter table public.transactions
  add column if not exists installment_id uuid
  references public.installments(id) on delete set null;

create unique index if not exists ux_transactions_installment
  on public.transactions (installment_id)
  where installment_id is not null;

create or replace function public.handle_installment_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_installments_count integer;
  v_amount numeric(14,2);
  v_date date;
  v_note text;
begin
  select client_id, installments_count
    into v_client_id, v_installments_count
    from public.contracts
   where id = new.contract_id;

  v_amount := coalesce(new.paid_value, new.value);
  v_date   := coalesce(new.paid_at::date, current_date);
  v_note   := format('Parcela %s/%s', new.number, v_installments_count);

  if new.status = 'Paga' then
    update public.transactions
       set client_id = v_client_id,
           amount = v_amount,
           date = v_date,
           payment_method = new.payment_method,
           note = v_note,
           updated_at = now()
     where installment_id = new.id;

    if not found then
      insert into public.transactions (
        user_id, installment_id, client_id, type, amount, date,
        context, payment_method, note, created_at, updated_at
      ) values (
        new.user_id, new.id, v_client_id, 'Receita', v_amount, v_date,
        'PJ', new.payment_method, v_note, now(), now()
      );
    end if;
  else
    delete from public.transactions where installment_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_installments_paid on public.installments;
create trigger trg_installments_paid
  after update of status, paid_value, paid_at, payment_method
  on public.installments
  for each row execute function public.handle_installment_paid();

-- ------------------------------------------------------------
-- 4. Grants + reload do schema cache
-- ------------------------------------------------------------
grant usage on schema public to authenticated, anon, service_role;
grant select, insert, update, delete on public.investment_positions to authenticated;
grant select on public.investment_positions to anon;
grant all on public.investment_positions to service_role;
grant select, insert, update, delete on public.contracts to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

notify pgrst, 'reload schema';
