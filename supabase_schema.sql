-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create Enums
create type public.expense_category as enum (
  'raw_material',
  'transport',
  'labour',
  'maintenance',
  'other'
);

create type public.payment_status as enum (
  'paid',
  'pending',
  'partial'
);

create type public.work_type as enum (
  'moulding',
  'stacking',
  'loading',
  'general'
);

-- Create Tables

-- Customers Table
create table public.customers (
  id uuid not null default gen_random_uuid(),
  name text not null,
  mobile text null,
  address text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint customers_pkey primary key (id)
);

-- Labour Table
create table public.labour (
  id uuid not null default gen_random_uuid(),
  name text not null,
  mobile text null,
  work_type public.work_type not null,
  daily_wage numeric not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint labour_pkey primary key (id)
);

-- Sales Table
create table public.sales (
  id uuid not null default gen_random_uuid(),
  customer_id uuid not null,
  date date not null default now(),
  quantity integer not null default 0,
  rate_per_brick numeric not null default 0,
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  payment_status public.payment_status not null default 'pending',
  notes text null,
  created_at timestamp with time zone not null default now(),
  constraint sales_pkey primary key (id),
  constraint sales_customer_id_fkey foreign key (customer_id) references public.customers (id) on delete cascade
);

-- Customer Payments Table
create table public.customer_payments (
  id uuid not null default gen_random_uuid(),
  customer_id uuid not null,
  sale_id uuid null,
  amount numeric not null,
  payment_date date not null default now(),
  notes text null,
  created_at timestamp with time zone not null default now(),
  constraint customer_payments_pkey primary key (id),
  constraint customer_payments_customer_id_fkey foreign key (customer_id) references public.customers (id) on delete cascade,
  constraint customer_payments_sale_id_fkey foreign key (sale_id) references public.sales (id) on delete set null
);

-- Expenses Table
create table public.expenses (
  id uuid not null default gen_random_uuid(),
  category public.expense_category not null,
  amount numeric not null,
  date date not null default now(),
  description text null,
  created_at timestamp with time zone not null default now(),
  constraint expenses_pkey primary key (id)
);

-- Attendance Table
create table public.attendance (
  id uuid not null default gen_random_uuid(),
  labour_id uuid not null,
  date date not null default now(),
  is_present boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint attendance_pkey primary key (id),
  constraint attendance_labour_id_fkey foreign key (labour_id) references public.labour (id) on delete cascade,
  constraint attendance_labour_date_key unique (labour_id, date)
);

-- Wage Payments Table
create table public.wage_payments (
  id uuid not null default gen_random_uuid(),
  labour_id uuid not null,
  amount numeric not null,
  payment_date date not null default now(),
  period_start date not null,
  period_end date not null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  constraint wage_payments_pkey primary key (id),
  constraint wage_payments_labour_id_fkey foreign key (labour_id) references public.labour (id) on delete cascade
);

-- Brick Production Table
create table public.brick_production (
  id uuid not null default gen_random_uuid(),
  date date not null default now(),
  quantity integer not null default 0,
  labour_id uuid null,
  team_name text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  constraint brick_production_pkey primary key (id),
  constraint brick_production_labour_id_fkey foreign key (labour_id) references public.labour (id) on delete set null
);

-- Advance Payments Table
create table public.advance_payments (
  id uuid not null default gen_random_uuid(),
  labour_id uuid not null,
  amount numeric not null,
  date date not null default now(),
  notes text null,
  created_at timestamp with time zone not null default now(),
  constraint advance_payments_pkey primary key (id),
  constraint advance_payments_labour_id_fkey foreign key (labour_id) references public.labour (id) on delete cascade
);

-- Enable Row Level Security (RLS) on all tables (Best Practice)
alter table public.customers enable row level security;
alter table public.labour enable row level security;
alter table public.sales enable row level security;
alter table public.customer_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.attendance enable row level security;
alter table public.wage_payments enable row level security;
alter table public.brick_production enable row level security;
alter table public.advance_payments enable row level security;

-- Create Policies (Allow all operations for now since it's an admin app, or specific public access if needed)
-- For simplicity in this step, we will allow public access, but in production, you should restrict this.

create policy "Enable all access for all users" on public.customers for all using (true) with check (true);
create policy "Enable all access for all users" on public.labour for all using (true) with check (true);
create policy "Enable all access for all users" on public.sales for all using (true) with check (true);
create policy "Enable all access for all users" on public.customer_payments for all using (true) with check (true);
create policy "Enable all access for all users" on public.expenses for all using (true) with check (true);
create policy "Enable all access for all users" on public.attendance for all using (true) with check (true);
create policy "Enable all access for all users" on public.wage_payments for all using (true) with check (true);
create policy "Enable all access for all users" on public.brick_production for all using (true) with check (true);
create policy "Enable all access for all users" on public.advance_payments for all using (true) with check (true);
