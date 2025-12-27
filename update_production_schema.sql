-- 1. Add 'rate_per_brick' to brick_production
ALTER TABLE public.brick_production 
ADD COLUMN IF NOT EXISTS rate_per_brick numeric NOT NULL DEFAULT 0;

-- 2. Add 'description' to attendance
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS description text;

-- 3. Add 'pin' to labour
ALTER TABLE public.labour 
ADD COLUMN IF NOT EXISTS pin text;

-- 4. Ensure RLS is fixed/open for these updates (Safely Re-apply)
drop policy if exists "Enable all access for all users" on public.brick_production;
create policy "Enable all access for all users" on public.brick_production for all using (true) with check (true);

drop policy if exists "Enable all access for all users" on public.attendance;
create policy "Enable all access for all users" on public.attendance for all using (true) with check (true);

drop policy if exists "Enable all access for all users" on public.labour;
create policy "Enable all access for all users" on public.labour for all using (true) with check (true);
