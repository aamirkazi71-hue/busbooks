-- =====================================================================
-- BusBooks database setup (Supabase)
-- HOW TO USE: Supabase dashboard -> SQL Editor -> New query ->
--             paste EVERYTHING in this file -> click "Run".
-- It is safe to run more than once.
--
-- Security: "Row Level Security" below makes sure every customer can
-- only ever see and change THEIR OWN buses, staff and records.
-- =====================================================================

-- Business details (one row per customer account)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  owner_name    text not null default '',
  currency      text not null default 'USD',
  created_at    timestamptz not null default now()
);

-- Buses
create table if not exists public.buses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null,
  plate        text not null default '',
  school       text not null default '',
  monthly_rent numeric(14,2) not null default 0,
  seats        integer,
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

-- Staff (drivers, conductors, helpers...)
create table if not exists public.staff (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null default 'Driver',
  phone      text not null default '',
  salary     numeric(14,2) not null default 0,
  bus_id     uuid references public.buses(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Every money in / money out record
create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type       text not null check (type in ('income', 'expense')),
  category   text not null,
  amount     numeric(14,2) not null check (amount >= 0),
  date       date not null default current_date,
  bus_id     uuid references public.buses(id) on delete set null,
  staff_id   uuid references public.staff(id) on delete set null,
  liters     numeric(10,2),
  note       text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists buses_user_idx      on public.buses (user_id);
create index if not exists staff_user_idx      on public.staff (user_id);
create index if not exists entries_user_date   on public.entries (user_id, date);

-- ---------------- Row Level Security ----------------
alter table public.profiles enable row level security;
alter table public.buses    enable row level security;
alter table public.staff    enable row level security;
alter table public.entries  enable row level security;

drop policy if exists "Own profile" on public.profiles;
create policy "Own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Own buses" on public.buses;
create policy "Own buses" on public.buses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Own staff" on public.staff;
create policy "Own staff" on public.staff for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Own entries" on public.entries;
create policy "Own entries" on public.entries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- =====================================================================
-- VERSION 2 additions: loan EMI, document reminders, documents + photos.
-- (Already ran the file before? Just run the whole file again. It's safe.)
-- =====================================================================
alter table public.buses    add column if not exists emi numeric(14,2) not null default 0;
alter table public.profiles add column if not exists remind_days integer not null default 30;

-- Bus documents (insurance, PUC, tax, fitness, permit) and
-- staff documents (license, Aadhaar, PAN, light bill, CV)
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  owner_type  text not null check (owner_type in ('bus', 'staff')),
  owner_id    uuid not null,
  doc_type    text not null,
  number      text not null default '',
  expiry_date date,
  file_path   text,
  file_name   text,
  file_type   text,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, owner_type, owner_id, doc_type)
);
create index if not exists documents_expiry_idx on public.documents (user_id, expiry_date);

alter table public.documents enable row level security;
drop policy if exists "Own documents" on public.documents;
create policy "Own documents" on public.documents for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Private storage for document photos / PDFs (max 10 MB each).
-- Each customer's files go in a folder named after their user id,
-- and the rules below only let them open their own folder.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "Own document files - read"   on storage.objects;
drop policy if exists "Own document files - add"    on storage.objects;
drop policy if exists "Own document files - change" on storage.objects;
drop policy if exists "Own document files - delete" on storage.objects;
create policy "Own document files - read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own document files - add" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own document files - change" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own document files - delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
