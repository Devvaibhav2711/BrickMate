-- Add new columns to the labour table
alter table public.labour 
add column if not exists adhar_no text null,
add column if not exists family_members text null,
add column if not exists email text null,
add column if not exists address text null,
add column if not exists photo_url text null;

-- Ensure RLS is enabled (it should be, but good to double check)
alter table public.labour enable row level security;

-- Re-apply policy effectively (or ensure existing one covers new columns)
drop policy if exists "Enable all access for all users" on public.labour;
create policy "Enable all access for all users" on public.labour for all using (true) with check (true);
