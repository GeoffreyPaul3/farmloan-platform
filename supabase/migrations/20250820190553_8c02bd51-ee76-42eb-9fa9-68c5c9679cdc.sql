
-- 1) Seasons
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.seasons enable row level security;

-- RLS: allow all authenticated to read seasons; admins manage
drop policy if exists "Seasons - anyone can select" on public.seasons;
create policy "Seasons - select" on public.seasons
for select using (true);

create policy "Seasons - admin manage" on public.seasons
for all using (get_user_role(auth.uid()) = 'admin') with check (get_user_role(auth.uid()) = 'admin');

-- Updated_at trigger
drop trigger if exists seasons_set_updated_at on public.seasons;
create trigger seasons_set_updated_at
before update on public.seasons
for each row execute function public.update_updated_at_column();

-- 2) Extend farmer_groups with club metadata
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmer_groups' and column_name='club_type') then
    alter table public.farmer_groups add column club_type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmer_groups' and column_name='village_headman') then
    alter table public.farmer_groups add column village_headman text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmer_groups' and column_name='group_village_headman') then
    alter table public.farmer_groups add column group_village_headman text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmer_groups' and column_name='traditional_authority') then
    alter table public.farmer_groups add column traditional_authority text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmer_groups' and column_name='epa') then
    alter table public.farmer_groups add column epa text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmer_groups' and column_name='chairperson_name') then
    alter table public.farmer_groups add column chairperson_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmer_groups' and column_name='chairperson_phone') then
    alter table public.farmer_groups add column chairperson_phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmer_groups' and column_name='contract_path') then
    alter table public.farmer_groups add column contract_path text;
  end if;
end $$;

-- 3) Enrich farmers with identity and geolocation
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmers' and column_name='photo_path') then
    alter table public.farmers add column photo_path text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmers' and column_name='signature_path') then
    alter table public.farmers add column signature_path text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmers' and column_name='gps_lat') then
    alter table public.farmers add column gps_lat numeric(9,6);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='farmers' and column_name='gps_lng') then
    alter table public.farmers add column gps_lng numeric(9,6);
  end if;
end $$;

-- Unique national_id (partial index to avoid failing on NULL)
do $$
begin
  if not exists (
    select 1 from pg_indexes 
    where schemaname='public' and indexname='unique_farmers_national_id'
  ) then
    create unique index unique_farmers_national_id on public.farmers (national_id) where national_id is not null;
  end if;
end $$;

-- 4) Staff-club assignment
create table if not exists public.club_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  farmer_group_id uuid not null,
  assigned_by uuid not null,
  created_at timestamptz not null default now()
);
alter table public.club_assignments enable row level security;

create unique index if not exists club_assignments_unique on public.club_assignments (user_id, farmer_group_id);

-- RLS: admins manage all; staff select own assignments
drop policy if exists "Club assignments - admin manage" on public.club_assignments;
drop policy if exists "Club assignments - staff view own" on public.club_assignments;

create policy "Club assignments - admin manage" on public.club_assignments
for all using (get_user_role(auth.uid()) = 'admin') with check (get_user_role(auth.uid()) = 'admin');

create policy "Club assignments - staff view own" on public.club_assignments
for select using (user_id = auth.uid());

-- 5) Helper functions for assignment-scoped RLS
create or replace function public.is_user_assigned_to_club(_club_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_assignments ca
    where ca.farmer_group_id = _club_id
      and ca.user_id = _user_id
  );
$$;

create or replace function public.loan_belongs_to_user(_loan_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.loans l
    join public.club_assignments ca on ca.farmer_group_id = l.farmer_group_id
    where l.id = _loan_id
      and ca.user_id = _user_id
  );
$$;

-- 6) Tighten RLS on core tables to assignment-based access

-- farmer_groups
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='farmer_groups' and policyname='Authenticated users can view farmer groups') then
    drop policy "Authenticated users can view farmer groups" on public.farmer_groups;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='farmer_groups' and policyname='Staff can create farmer groups') then
    drop policy "Staff can create farmer groups" on public.farmer_groups;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='farmer_groups' and policyname='Staff can update farmer groups') then
    drop policy "Staff can update farmer groups" on public.farmer_groups;
  end if;
end $$;

create policy "Clubs - admin select all" on public.farmer_groups
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Clubs - staff select assigned" on public.farmer_groups
for select using (public.is_user_assigned_to_club(id, auth.uid()));

create policy "Clubs - insert by staff or admin" on public.farmer_groups
for insert with check (get_user_role(auth.uid()) is not null);

create policy "Clubs - update staff assigned or admin" on public.farmer_groups
for update using (
  get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(id, auth.uid())
) with check (
  get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(id, auth.uid())
);

-- farmers
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='farmers' and policyname='Authenticated users can view farmers') then
    drop policy "Authenticated users can view farmers" on public.farmers;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='farmers' and policyname='Staff can manage farmers') then
    drop policy "Staff can manage farmers" on public.farmers;
  end if;
end $$;

create policy "Farmers - admin select all" on public.farmers
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Farmers - staff select assigned" on public.farmers
for select using (public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Farmers - insert staff/admin with assigned club" on public.farmers
for insert with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Farmers - update staff/admin assigned" on public.farmers
for update using (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()))
with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Farmers - delete staff/admin assigned" on public.farmers
for delete using (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

-- loans
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='loans' and policyname='Authenticated users can view loans') then
    drop policy "Authenticated users can view loans" on public.loans;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='loans' and policyname='Staff can manage loans') then
    drop policy "Staff can manage loans" on public.loans;
  end if;
end $$;

create policy "Loans - admin select all" on public.loans
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Loans - staff select assigned" on public.loans
for select using (public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Loans - insert staff/admin assigned" on public.loans
for insert with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Loans - update staff/admin assigned" on public.loans
for update using (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()))
with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Loans - delete staff/admin assigned" on public.loans
for delete using (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

-- repayments
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='repayments' and policyname='Authenticated users can view repayments') then
    drop policy "Authenticated users can view repayments" on public.repayments;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='repayments' and policyname='Staff can manage repayments') then
    drop policy "Staff can manage repayments" on public.repayments;
  end if;
end $$;

create policy "Repayments - admin select all" on public.repayments
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Repayments - staff select assigned via loan" on public.repayments
for select using (public.loan_belongs_to_user(loan_id, auth.uid()));

create policy "Repayments - insert staff/admin via loan" on public.repayments
for insert with check (get_user_role(auth.uid()) = 'admin' or public.loan_belongs_to_user(loan_id, auth.uid()));

create policy "Repayments - update staff/admin via loan" on public.repayments
for update using (get_user_role(auth.uid()) = 'admin' or public.loan_belongs_to_user(loan_id, auth.uid()))
with check (get_user_role(auth.uid()) = 'admin' or public.loan_belongs_to_user(loan_id, auth.uid()));

create policy "Repayments - delete staff/admin via loan" on public.repayments
for delete using (get_user_role(auth.uid()) = 'admin' or public.loan_belongs_to_user(loan_id, auth.uid()));

-- 7) Inputs & equipment (new inputs tables; equipment kept as-is)

-- Enum not strictly necessary for category; using text with check for flexibility
create table if not exists public.input_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('fertilizer','pesticide','seed','other')),
  unit text not null default 'kg',
  sku text unique,
  active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.input_items enable row level security;

create policy "Input items - select all auth" on public.input_items
for select using (true);

create policy "Input items - staff/admin manage" on public.input_items
for all using (get_user_role(auth.uid()) is not null)
with check (get_user_role(auth.uid()) is not null);

drop trigger if exists input_items_set_updated_at on public.input_items;
create trigger input_items_set_updated_at
before update on public.input_items
for each row execute function public.update_updated_at_column();

create table if not exists public.input_stock (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.input_items(id),
  quantity numeric not null,
  unit_cost numeric,
  received_date date not null default current_date,
  source text,
  season_id uuid references public.seasons(id),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text
);
alter table public.input_stock enable row level security;

create policy "Input stock - select all auth" on public.input_stock
for select using (true);

create policy "Input stock - staff/admin manage" on public.input_stock
for all using (get_user_role(auth.uid()) is not null)
with check (get_user_role(auth.uid()) is not null);

drop trigger if exists input_stock_set_updated_at on public.input_stock;
create trigger input_stock_set_updated_at
before update on public.input_stock
for each row execute function public.update_updated_at_column();

create table if not exists public.input_distributions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.input_items(id),
  farmer_group_id uuid not null,
  farmer_id uuid,
  quantity numeric not null,
  distribution_date date not null default current_date,
  distributed_by uuid not null,
  acknowledgement_received boolean not null default false,
  acknowledgement_path text,
  season_id uuid references public.seasons(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.input_distributions enable row level security;

create policy "Input dist - admin select all" on public.input_distributions
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Input dist - staff select assigned" on public.input_distributions
for select using (public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Input dist - insert staff/admin assigned" on public.input_distributions
for insert with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Input dist - update staff/admin assigned" on public.input_distributions
for update using (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()))
with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Input dist - delete staff/admin assigned" on public.input_distributions
for delete using (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

drop trigger if exists input_distributions_set_updated_at on public.input_distributions;
create trigger input_distributions_set_updated_at
before update on public.input_distributions
for each row execute function public.update_updated_at_column();

create table if not exists public.input_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid not null references public.input_distributions(id) on delete cascade,
  ack_by uuid,
  ack_at timestamptz not null default now(),
  signature_path text,
  photo_path text,
  notes text
);
alter table public.input_acknowledgements enable row level security;

create policy "Input acks - admin select all" on public.input_acknowledgements
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Input acks - staff select assigned" on public.input_acknowledgements
for select using (
  exists (
    select 1 from public.input_distributions d
    where d.id = distribution_id
      and public.is_user_assigned_to_club(d.farmer_group_id, auth.uid())
  )
);

create policy "Input acks - insert staff/admin assigned" on public.input_acknowledgements
for insert with check (
  get_user_role(auth.uid()) = 'admin'
  or exists (
    select 1 from public.input_distributions d
    where d.id = distribution_id
      and public.is_user_assigned_to_club(d.farmer_group_id, auth.uid())
  )
);

-- 8) Field monitoring
do $$
begin
  if not exists (select 1 from pg_type where typname = 'crop_stage_enum') then
    create type public.crop_stage_enum as enum ('sowing','vegetative','flowering','boll_formation','maturity','harvest');
  end if;
end $$;

create table if not exists public.field_visits (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null,
  farmer_group_id uuid not null,
  season_id uuid references public.seasons(id),
  visit_date date not null default current_date,
  gps_lat numeric(9,6),
  gps_lng numeric(9,6),
  observations text,
  crop_stage public.crop_stage_enum,
  expected_yield numeric,
  photos jsonb not null default '[]'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.field_visits enable row level security;

create policy "Field visits - admin select all" on public.field_visits
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Field visits - staff select assigned" on public.field_visits
for select using (public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Field visits - insert staff/admin assigned" on public.field_visits
for insert with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Field visits - update staff/admin assigned" on public.field_visits
for update using (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()))
with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

drop trigger if exists field_visits_set_updated_at on public.field_visits;
create trigger field_visits_set_updated_at
before update on public.field_visits
for each row execute function public.update_updated_at_column();

-- 9) Buying & grading
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null,
  farmer_group_id uuid not null,
  season_id uuid references public.seasons(id),
  delivery_date date not null default current_date,
  weight numeric not null,
  officer_id uuid not null,
  price_per_kg numeric,
  gross_amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.deliveries enable row level security;

create policy "Deliveries - admin select all" on public.deliveries
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Deliveries - staff select assigned" on public.deliveries
for select using (public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Deliveries - insert staff/admin assigned" on public.deliveries
for insert with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

create policy "Deliveries - update staff/admin assigned" on public.deliveries
for update using (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()))
with check (get_user_role(auth.uid()) = 'admin' or public.is_user_assigned_to_club(farmer_group_id, auth.uid()));

drop trigger if exists deliveries_set_updated_at on public.deliveries;
create trigger deliveries_set_updated_at
before update on public.deliveries
for each row execute function public.update_updated_at_column();

create table if not exists public.grading_entries (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  grader_id uuid not null,
  grade text not null,
  weight numeric not null,
  created_at timestamptz not null default now()
);
alter table public.grading_entries enable row level security;

create policy "Grading - admin select all" on public.grading_entries
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Grading - staff select via delivery" on public.grading_entries
for select using (
  exists (
    select 1 from public.deliveries d
    where d.id = delivery_id
      and public.is_user_assigned_to_club(d.farmer_group_id, auth.uid())
  )
);

create policy "Grading - insert staff/admin via delivery" on public.grading_entries
for insert with check (
  get_user_role(auth.uid()) = 'admin'
  or exists (
    select 1 from public.deliveries d
    where d.id = delivery_id
      and public.is_user_assigned_to_club(d.farmer_group_id, auth.uid())
  )
);

-- 10) Payments & loan recovery
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  gross_amount numeric not null,
  loan_deduction numeric not null default 0,
  net_paid numeric not null,
  method text not null check (method in ('bank','mobile','cash')),
  reference_number text,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
alter table public.payouts enable row level security;

create policy "Payouts - admin select all" on public.payouts
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Payouts - staff select via delivery" on public.payouts
for select using (
  exists (
    select 1 from public.deliveries d
    where d.id = delivery_id
      and public.is_user_assigned_to_club(d.farmer_group_id, auth.uid())
  )
);

create policy "Payouts - insert staff/admin via delivery" on public.payouts
for insert with check (
  get_user_role(auth.uid()) = 'admin'
  or exists (
    select 1 from public.deliveries d
    where d.id = delivery_id
      and public.is_user_assigned_to_club(d.farmer_group_id, auth.uid())
  )
);

create table if not exists public.loan_ledgers (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null,
  season_id uuid references public.seasons(id),
  loan_id uuid,
  entry_type text not null check (entry_type in ('loan_disbursed','input_distributed','repayment','sale_deduction','adjustment')),
  amount numeric not null,
  balance_after numeric,
  reference_table text,
  reference_id uuid,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
alter table public.loan_ledgers enable row level security;

create policy "Loan ledger - admin select all" on public.loan_ledgers
for select using (get_user_role(auth.uid()) = 'admin');

create policy "Loan ledger - staff select assigned via farmer group" on public.loan_ledgers
for select using (
  exists (
    select 1 from public.farmers f
    where f.id = farmer_id
      and public.is_user_assigned_to_club(f.farmer_group_id, auth.uid())
  )
);

create policy "Loan ledger - insert staff/admin assigned" on public.loan_ledgers
for insert with check (
  get_user_role(auth.uid()) = 'admin'
  or exists (
    select 1 from public.farmers f
    where f.id = farmer_id
      and public.is_user_assigned_to_club(f.farmer_group_id, auth.uid())
  )
);

-- 11) Audit trigger to log all changes
create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table text := TG_TABLE_NAME;
  v_action text := TG_OP;
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
begin
  if (v_action = 'INSERT') then
    v_new := to_jsonb(NEW);
    v_id := NEW.id;
    insert into public.audit_logs (table_name, action, record_id, user_id, new_values, created_at)
    values (v_table, v_action, v_id, coalesce(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid), v_new, now());
    return NEW;
  elsif (v_action = 'UPDATE') then
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_id := NEW.id;
    insert into public.audit_logs (table_name, action, record_id, user_id, old_values, new_values, created_at)
    values (v_table, v_action, v_id, coalesce(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid), v_old, v_new, now());
    return NEW;
  elsif (v_action = 'DELETE') then
    v_old := to_jsonb(OLD);
    v_id := OLD.id;
    insert into public.audit_logs (table_name, action, record_id, user_id, old_values, created_at)
    values (v_table, v_action, v_id, coalesce(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid), v_old, now());
    return OLD;
  end if;
  return null;
end;
$$;

-- Attach audit triggers to critical tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'farmer_groups','farmers','loans','repayments',
    'input_items','input_stock','input_distributions','input_acknowledgements',
    'field_visits','deliveries','grading_entries','payouts','loan_ledgers',
    'equipment','equipment_issuance'
  ]
  loop
    execute format('drop trigger if exists %I_audit on public.%I', tbl, tbl);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.log_audit()', tbl, tbl);
  end loop;
end $$;

-- 12) Storage buckets for documents and media
insert into storage.buckets (id, name, public) values ('contracts','contracts', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('farmer-photos','farmer-photos', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('signatures','signatures', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('field-photos','field-photos', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('csv-uploads','csv-uploads', false)
on conflict (id) do nothing;

-- Path-based storage access helper: expects object path like 'club/<club_id>/...'
create or replace function public.is_user_allowed_storage_object(object_name text, bucket text, _user_id uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  club_id uuid;
begin
  begin
    club_id := nullif(split_part(object_name, '/', 2), '')::uuid;
  exception when others then
    club_id := null;
  end;
  if club_id is null then
    return false;
  end if;

  return exists (
    select 1
    from public.club_assignments ca
    where ca.user_id = _user_id
      and ca.farmer_group_id = club_id
  );
end;
$$;

-- Admin full access to storage
drop policy if exists "Storage - admin all" on storage.objects;
create policy "Storage - admin all" on storage.objects
for all using (public.get_user_role(auth.uid()) = 'admin')
with check (public.get_user_role(auth.uid()) = 'admin');

-- Staff access only to assigned club folders for specific buckets
drop policy if exists "Storage - staff by club path" on storage.objects;
create policy "Storage - staff by club path" on storage.objects
for all using (
  bucket_id in ('contracts','farmer-photos','signatures','field-photos','csv-uploads')
  and public.is_user_allowed_storage_object(name, bucket_id::text, auth.uid())
)
with check (
  bucket_id in ('contracts','farmer-photos','signatures','field-photos','csv-uploads')
  and public.is_user_allowed_storage_object(name, bucket_id::text, auth.uid())
);
