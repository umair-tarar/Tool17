create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  access_status text not null default 'pending' check (access_status in ('pending', 'approved', 'rejected', 'revoked')),
  created_at timestamptz not null default now()
);

create table if not exists public.credits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  used integer not null default 0 check (used >= 0),
  base_credits integer not null default 200000 check (base_credits >= 0),
  extra_credits integer not null default 0 check (extra_credits >= 0),
  remaining integer not null default 200000 check (remaining >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  action text not null check (action in ('login', 'registration')),
  created_at timestamptz not null default now()
);

create table if not exists public.credit_reset_activity (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  admin_user_id uuid not null references public.profiles(id) on delete restrict,
  action text not null check (action = 'credit_reset'),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  client_submission_id uuid,
  notification_attempted_at timestamptz,
  notification_sent_at timestamptz
);

alter table public.contact_messages add column if not exists client_submission_id uuid;
alter table public.contact_messages add column if not exists notification_attempted_at timestamptz;
alter table public.contact_messages add column if not exists notification_sent_at timestamptz;
alter table public.contact_messages enable row level security;
create unique index if not exists contact_messages_client_submission_id_key
  on public.contact_messages (client_submission_id)
  where client_submission_id is not null;

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists created_at timestamptz default now();
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'access_status'
  ) then
    alter table public.profiles add column access_status text default 'pending';
  end if;
end;
$$;
alter table public.profiles alter column access_status set default 'pending';
alter table public.profiles alter column access_status set not null;
alter table public.profiles drop constraint if exists profiles_access_status_check;
alter table public.profiles add constraint profiles_access_status_check
  check (access_status in ('pending', 'approved', 'rejected', 'revoked'));
update public.profiles set email = '' where email is null;
update public.profiles set role = 'user' where role is null;
update public.profiles set created_at = now() where created_at is null;
alter table public.profiles alter column email set not null;
alter table public.profiles alter column role set default 'user';
alter table public.profiles alter column created_at set default now();

alter table public.credits add column if not exists used integer default 0;
alter table public.credits add column if not exists base_credits integer default 200000;
alter table public.credits add column if not exists extra_credits integer default 0;
alter table public.credits add column if not exists remaining integer default 200000;
alter table public.credits add column if not exists updated_at timestamptz default now();
update public.credits set used = 0 where used is null;
update public.credits set base_credits = 200000 where base_credits is null;
update public.credits set extra_credits = 0 where extra_credits is null;
update public.credits set remaining = base_credits + extra_credits - used;
update public.credits set updated_at = now() where updated_at is null;
alter table public.credits alter column used set default 0;
alter table public.credits alter column base_credits set default 200000;
alter table public.credits alter column extra_credits set default 0;
alter table public.credits alter column remaining set default 200000;
alter table public.credits alter column updated_at set default now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, access_status)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'user', 'pending')
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  insert into public.credits (user_id, used, base_credits, extra_credits, remaining)
  values (new.id, 0, 200000, 0, 200000)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.consume_credits(amount integer)
returns public.credits
language plpgsql
security definer set search_path = public
as $$
declare result public.credits;
begin
  if amount <= 0 then raise exception 'Amount must be positive'; end if;
  update public.credits
  set used = used + amount, remaining = remaining - amount, updated_at = now()
  where user_id = auth.uid()
    and remaining >= amount
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and (role = 'admin' or access_status = 'approved')
    )
  returning * into result;
  if result.user_id is null then raise exception 'Not enough credits'; end if;
  return result;
end;
$$;

create or replace function public.reset_user_credits(target_user_id uuid)
returns public.credits
language plpgsql
security definer set search_path = public
as $$
declare result public.credits;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'User not found';
  end if;

  insert into public.credits (user_id, used, base_credits, extra_credits, remaining, updated_at)
  values (target_user_id, 0, 200000, 0, 200000, now())
  on conflict (user_id) do update
    set used = 0,
        base_credits = 200000,
        remaining = 200000 + public.credits.extra_credits,
        updated_at = now()
  returning * into result;

  insert into public.credit_reset_activity (target_user_id, admin_user_id, action)
  values (target_user_id, auth.uid(), 'credit_reset');

  return result;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.credit_reset_activity drop constraint if exists credit_reset_activity_action_check;
alter table public.credit_reset_activity add constraint credit_reset_activity_action_check
  check (action in ('credit_reset', 'access_approved', 'access_rejected', 'access_revoked'));

create or replace function public.manage_user_access(target_user_id uuid, new_status text)
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  result public.profiles;
  audit_action text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Admins cannot change their own access status';
  end if;

  if new_status not in ('approved', 'rejected', 'revoked') then
    raise exception 'Invalid access status';
  end if;

  audit_action := 'access_' || new_status;

  update public.profiles
  set access_status = new_status
  where id = target_user_id
  returning * into result;

  if result.id is null then
    raise exception 'User not found';
  end if;

  insert into public.credit_reset_activity (target_user_id, admin_user_id, action)
  values (target_user_id, auth.uid(), audit_action);

  return result;
end;
$$;

grant execute on function public.is_admin() to authenticated;
revoke all on function public.manage_user_access(uuid, text) from public;
grant execute on function public.manage_user_access(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.credits enable row level security;
alter table public.login_activity enable row level security;
alter table public.credit_reset_activity enable row level security;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile" on public.profiles for select using (id = auth.uid());
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());

drop policy if exists "Users can view their credits" on public.credits;
create policy "Users can view their credits" on public.credits for select using (user_id = auth.uid());
drop policy if exists "Admins can view all credits" on public.credits;
create policy "Admins can view all credits" on public.credits for select using (public.is_admin());

drop policy if exists "Users can insert their activity" on public.login_activity;
create policy "Users can insert their activity" on public.login_activity for insert with check (user_id = auth.uid());
drop policy if exists "Admins can view all activity" on public.login_activity;
create policy "Admins can view all activity" on public.login_activity for select using (public.is_admin());
drop policy if exists "Admins can view credit reset activity" on public.credit_reset_activity;
create policy "Admins can view credit reset activity" on public.credit_reset_activity for select using (public.is_admin());

grant execute on function public.consume_credits(integer) to authenticated;
revoke all on function public.reset_user_credits(uuid) from public;
grant execute on function public.reset_user_credits(uuid) to authenticated;

create index if not exists login_activity_user_id_created_at_idx on public.login_activity(user_id, created_at desc);
create index if not exists credit_reset_activity_target_user_id_created_at_idx on public.credit_reset_activity(target_user_id, created_at desc);
