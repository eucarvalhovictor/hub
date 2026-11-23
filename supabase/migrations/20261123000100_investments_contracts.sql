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
