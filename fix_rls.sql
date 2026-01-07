
-- 1. Enable RLS on all tables (Safety check)
alter table public.customers enable row level security;
alter table public.labour enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.attendance enable row level security;
alter table public.wage_payments enable row level security;
alter table public.advance_payments enable row level security;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Enable all access for all users" on public.customers;
drop policy if exists "Enable all access for all users" on public.labour;
drop policy if exists "Enable all access for all users" on public.sales;
drop policy if exists "Enable all access for all users" on public.expenses;
drop policy if exists "Enable all access for all users" on public.attendance;
drop policy if exists "Enable all access for all users" on public.wage_payments;
drop policy if exists "Enable all access for all users" on public.advance_payments;

-- 3. Re-create permissive policies for ANON (since you are using anon key for now)
-- WARNING: This allows ANYONE with your API key to edit data. 
-- Ideally, implement Auth, but for this stage, this fixes the "Crud Not Working" issue.

create policy "Enable all access for all users" on public.customers for all using (true) with check (true);
create policy "Enable all access for all users" on public.labour for all using (true) with check (true);
create policy "Enable all access for all users" on public.sales for all using (true) with check (true);
create policy "Enable all access for all users" on public.expenses for all using (true) with check (true);
create policy "Enable all access for all users" on public.attendance for all using (true) with check (true);
create policy "Enable all access for all users" on public.wage_payments for all using (true) with check (true);
create policy "Enable all access for all users" on public.advance_payments for all using (true) with check (true);
