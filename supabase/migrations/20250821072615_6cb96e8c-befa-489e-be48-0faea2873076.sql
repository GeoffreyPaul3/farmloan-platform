
-- Phase 1: Database fixes and approval gating

-- 1) Add 'approved' column to profiles (default false)
alter table public.profiles
  add column if not exists approved boolean not null default false;

-- 2) Update get_user_role to return NULL unless approved
create or replace function public.get_user_role(user_id uuid)
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select case 
    when exists (
      select 1
      from public.profiles p
      where p.user_id = get_user_role.user_id
        and coalesce(p.approved, false) = true
    )
    then (select p.role from public.profiles p where p.user_id = get_user_role.user_id)
    else null::user_role
  end;
$$;

-- 3) Allow admins to update any profile (in addition to users updating their own)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Admins can update all profiles'
  ) then
    create policy "Admins can update all profiles"
      on public.profiles
      for update
      using (get_user_role(auth.uid()) = 'admin'::user_role)
      with check (get_user_role(auth.uid()) = 'admin'::user_role);
  end if;
end$$;

-- 4) Unique partial index to prevent duplicate National IDs
create unique index if not exists idx_farmers_national_id_unique
  on public.farmers (national_id)
  where national_id is not null;

-- 5) Add missing foreign keys (with guards) and indexes for nested selects

-- Helper: add FK if missing
do $$
begin
  -- deliveries → farmers
  if not exists (select 1 from pg_constraint where conname = 'deliveries_farmer_id_fkey') then
    alter table public.deliveries
      add constraint deliveries_farmer_id_fkey
      foreign key (farmer_id) references public.farmers(id) on delete restrict;
  end if;

  -- deliveries → farmer_groups
  if not exists (select 1 from pg_constraint where conname = 'deliveries_farmer_group_id_fkey') then
    alter table public.deliveries
      add constraint deliveries_farmer_group_id_fkey
      foreign key (farmer_group_id) references public.farmer_groups(id) on delete restrict;
  end if;

  -- field_visits → farmers
  if not exists (select 1 from pg_constraint where conname = 'field_visits_farmer_id_fkey') then
    alter table public.field_visits
      add constraint field_visits_farmer_id_fkey
      foreign key (farmer_id) references public.farmers(id) on delete restrict;
  end if;

  -- field_visits → farmer_groups
  if not exists (select 1 from pg_constraint where conname = 'field_visits_farmer_group_id_fkey') then
    alter table public.field_visits
      add constraint field_visits_farmer_group_id_fkey
      foreign key (farmer_group_id) references public.farmer_groups(id) on delete restrict;
  end if;

  -- input_distributions → farmer_groups
  if not exists (select 1 from pg_constraint where conname = 'input_distributions_farmer_group_id_fkey') then
    alter table public.input_distributions
      add constraint input_distributions_farmer_group_id_fkey
      foreign key (farmer_group_id) references public.farmer_groups(id) on delete restrict;
  end if;

  -- input_distributions → farmers
  if not exists (select 1 from pg_constraint where conname = 'input_distributions_farmer_id_fkey') then
    alter table public.input_distributions
      add constraint input_distributions_farmer_id_fkey
      foreign key (farmer_id) references public.farmers(id) on delete set null;
  end if;

  -- loan_ledgers → farmers
  if not exists (select 1 from pg_constraint where conname = 'loan_ledgers_farmer_id_fkey') then
    alter table public.loan_ledgers
      add constraint loan_ledgers_farmer_id_fkey
      foreign key (farmer_id) references public.farmers(id) on delete restrict;
  end if;

  -- loan_ledgers → loans
  if not exists (select 1 from pg_constraint where conname = 'loan_ledgers_loan_id_fkey') then
    alter table public.loan_ledgers
      add constraint loan_ledgers_loan_id_fkey
      foreign key (loan_id) references public.loans(id) on delete set null;
  end if;

end$$;

-- Helpful indexes for performance on FK columns
create index if not exists idx_deliveries_farmer_id on public.deliveries(farmer_id);
create index if not exists idx_deliveries_farmer_group_id on public.deliveries(farmer_group_id);
create index if not exists idx_field_visits_farmer_id on public.field_visits(farmer_id);
create index if not exists idx_field_visits_farmer_group_id on public.field_visits(farmer_group_id);
create index if not exists idx_input_distributions_farmer_group_id on public.input_distributions(farmer_group_id);
create index if not exists idx_input_distributions_farmer_id on public.input_distributions(farmer_id);
create index if not exists idx_loan_ledgers_farmer_id on public.loan_ledgers(farmer_id);
create index if not exists idx_loan_ledgers_loan_id on public.loan_ledgers(loan_id);

-- 6) Promote the admin account if it already exists (safe to run multiple times)
insert into public.profiles (user_id, email, full_name, role, approved)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)) as full_name,
       'admin'::user_role, true
from auth.users u
where u.email = 'geofreypaul40@gmail.com'
on conflict (user_id)
do update set role = 'admin'::user_role, approved = true, email = excluded.email;
