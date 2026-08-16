begin;

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('basic', 'standard', 'premium')),
  name text not null,
  monthly_price numeric(12, 2) not null check (monthly_price > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  credits_per_period integer not null check (credits_per_period > 0),
  billing_period text not null default 'monthly' check (billing_period = 'monthly'),
  is_featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.subscription_plans (slug, name, monthly_price, credits_per_period, billing_period, is_featured)
values
  ('basic', 'Basic', 18.00, 50000, 'monthly', false),
  ('standard', 'Standard', 36.00, 100000, 'monthly', true),
  ('premium', 'Premium', 72.00, 200000, 'monthly', false)
on conflict (slug) do nothing;

create table if not exists public.subscription_payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  provider text not null check (provider in ('visa_card', 'nayapay', 'easypaisa', 'jazzcash')),
  provider_reference text not null,
  manual_transaction_reference text,
  manual_note text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  credits_allocated integer not null check (credits_allocated > 0),
  status text not null default 'pending' check (status in ('pending', 'submitted_for_review', 'approved', 'rejected', 'cancelled')),
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference),
  unique (provider, manual_transaction_reference)
);

create unique index if not exists subscription_payment_one_pending_request_idx
  on public.subscription_payment_requests(user_id, plan_id)
  where status in ('pending', 'submitted_for_review');
create index if not exists subscription_payment_user_created_idx
  on public.subscription_payment_requests(user_id, created_at desc);
create index if not exists subscription_payment_review_idx
  on public.subscription_payment_requests(status, submitted_at desc);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled', 'rejected')),
  billing_period text not null default 'monthly' check (billing_period = 'monthly'),
  start_date timestamptz,
  expiry_date timestamptz,
  credits_allocated integer not null default 0 check (credits_allocated >= 0),
  credits_used integer not null default 0 check (credits_used >= 0),
  credits_remaining integer not null default 0 check (credits_remaining >= 0),
  payment_id uuid references public.subscription_payment_requests(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (credits_used <= credits_allocated),
  check (credits_remaining = credits_allocated - credits_used),
  check ((status <> 'active') or (start_date is not null and expiry_date is not null and expiry_date > start_date))
);

create unique index if not exists subscriptions_one_active_per_user_idx
  on public.subscriptions(user_id)
  where status = 'active';
create index if not exists subscriptions_user_status_expiry_idx
  on public.subscriptions(user_id, status, expiry_date desc);

create table if not exists public.subscription_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  action text not null check (action in ('allocation', 'verification')),
  credits_used integer not null check (credits_used >= 0),
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);
create index if not exists subscription_credit_ledger_user_created_idx
  on public.subscription_credit_ledger(user_id, created_at desc);

alter table public.subscription_payment_requests enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_credit_ledger enable row level security;

create policy "Users can view their subscription payments" on public.subscription_payment_requests
  for select using (user_id = auth.uid());
create policy "Admins can view all subscription payments" on public.subscription_payment_requests
  for select using (public.is_admin());
create policy "Users can view their subscriptions" on public.subscriptions
  for select using (user_id = auth.uid());
create policy "Admins can view all subscriptions" on public.subscriptions
  for select using (public.is_admin());
create policy "Users can view their subscription credit ledger" on public.subscription_credit_ledger
  for select using (user_id = auth.uid());
create policy "Admins can view all subscription credit ledger" on public.subscription_credit_ledger
  for select using (public.is_admin());
create policy "Authenticated users can view active plans" on public.subscription_plans
  for select using (active = true and auth.uid() is not null);

alter table public.subscription_plans enable row level security;
create policy "Admins can manage subscription plans" on public.subscription_plans
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.credits alter column base_credits set default 0;
alter table public.credits alter column remaining set default 0;

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
  values (new.id, 0, 0, 0, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.create_subscription_manual_payment(
  requested_plan_slug text,
  requested_provider text
)
returns public.subscription_payment_requests
language plpgsql
security definer set search_path = public
as $$
declare
  plan public.subscription_plans;
  payment public.subscription_payment_requests;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if requested_provider not in ('visa_card', 'nayapay', 'easypaisa', 'jazzcash') then
    raise exception 'Unsupported payment provider';
  end if;
  if not exists (
    select 1 from public.payment_instructions
    where provider = requested_provider and active = true
      and nullif(trim(display_name), '') is not null
      and nullif(trim(account_identifier), '') is not null
      and nullif(trim(instructions), '') is not null
  ) then raise exception 'Payment method is not currently available'; end if;

  select * into plan from public.subscription_plans
  where slug = requested_plan_slug and active = true;
  if plan.id is null then raise exception 'Subscription plan is not available'; end if;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text || ':' || plan.id::text));
  select * into payment from public.subscription_payment_requests
  where user_id = auth.uid() and plan_id = plan.id and status in ('pending', 'submitted_for_review')
  for update;
  if payment.id is not null then
    if payment.provider <> requested_provider then
      raise exception 'A pending payment request already exists for this plan';
    end if;
    return payment;
  end if;

  insert into public.subscription_payment_requests (
    user_id, plan_id, provider, provider_reference, amount, currency, credits_allocated
  ) values (
    auth.uid(), plan.id, requested_provider,
    'sub_' || replace(gen_random_uuid()::text, '-', ''),
    plan.monthly_price, plan.currency, plan.credits_per_period
  ) returning * into payment;
  return payment;
end;
$$;

create or replace function public.submit_subscription_manual_payment(
  target_payment_id uuid,
  submitted_transaction_reference text,
  submitted_note text default null
)
returns public.subscription_payment_requests
language plpgsql
security definer set search_path = public
as $$
declare payment public.subscription_payment_requests;
begin
  if nullif(trim(submitted_transaction_reference), '') is null then
    raise exception 'Transaction reference is required';
  end if;
  select * into payment from public.subscription_payment_requests
  where id = target_payment_id and user_id = auth.uid() for update;
  if payment.id is null then raise exception 'Payment request not found'; end if;
  if payment.status = 'submitted_for_review' then
    if payment.manual_transaction_reference = trim(submitted_transaction_reference) then return payment; end if;
    raise exception 'Payment has already been submitted for review';
  end if;
  if payment.status <> 'pending' then raise exception 'Payment cannot be submitted'; end if;
  update public.subscription_payment_requests
  set status = 'submitted_for_review',
      manual_transaction_reference = trim(submitted_transaction_reference),
      manual_note = nullif(trim(coalesce(submitted_note, '')), ''),
      submitted_at = now(), updated_at = now()
  where id = payment.id
  returning * into payment;
  return payment;
end;
$$;

create or replace function public.approve_subscription_manual_payment(target_payment_id uuid)
returns public.subscriptions
language plpgsql
security definer set search_path = public
as $$
declare
  payment public.subscription_payment_requests;
  current_subscription public.subscriptions;
  result public.subscriptions;
  next_start timestamptz;
  next_expiry timestamptz;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select * into payment from public.subscription_payment_requests where id = target_payment_id for update;
  if payment.id is null then raise exception 'Payment request not found'; end if;
  if payment.status = 'approved' then
    select * into result from public.subscriptions where payment_id = payment.id;
    return result;
  end if;
  if payment.status <> 'submitted_for_review' or payment.manual_transaction_reference is null then
    raise exception 'Payment is not awaiting manual review';
  end if;

  update public.subscription_payment_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = payment.id;

  select * into current_subscription from public.subscriptions
  where user_id = payment.user_id and status = 'active' for update;
  next_start := now();
  next_expiry := greatest(coalesce(current_subscription.expiry_date, now()), now()) + interval '1 month';

  if current_subscription.id is null then
    insert into public.subscriptions (
      user_id, plan_id, status, billing_period, start_date, expiry_date,
      credits_allocated, credits_used, credits_remaining, payment_id
    ) values (
      payment.user_id, payment.plan_id, 'active', 'monthly', next_start, next_expiry,
      payment.credits_allocated, 0, payment.credits_allocated, payment.id
    ) returning * into result;
  else
    update public.subscriptions
    set plan_id = payment.plan_id, billing_period = 'monthly', expiry_date = next_expiry,
        credits_allocated = payment.credits_allocated, credits_used = 0,
        credits_remaining = payment.credits_allocated, payment_id = payment.id, updated_at = now()
    where id = current_subscription.id
    returning * into result;
  end if;

  insert into public.subscription_credit_ledger (user_id, subscription_id, action, credits_used, balance_after)
  values (result.user_id, result.id, 'allocation', 0, result.credits_remaining);
  return result;
end;
$$;

create or replace function public.reject_subscription_manual_payment(target_payment_id uuid, reason text)
returns public.subscription_payment_requests
language plpgsql
security definer set search_path = public
as $$
declare result public.subscription_payment_requests;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if nullif(trim(reason), '') is null then raise exception 'Rejection reason is required'; end if;
  update public.subscription_payment_requests
  set status = 'rejected', rejection_reason = trim(reason), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = target_payment_id and status = 'submitted_for_review'
  returning * into result;
  if result.id is null then raise exception 'Payment is not awaiting manual review'; end if;
  return result;
end;
$$;

create or replace function public.consume_subscription_credits(amount integer)
returns public.subscriptions
language plpgsql
security definer set search_path = public
as $$
declare result public.subscriptions;
begin
  if amount <= 0 then raise exception 'Amount must be positive'; end if;
  update public.subscriptions
  set status = case when expiry_date <= now() then 'expired' else status end,
      updated_at = now()
  where user_id = auth.uid() and status = 'active' and expiry_date <= now();

  update public.subscriptions
  set credits_used = credits_used + amount,
      credits_remaining = credits_remaining - amount,
      updated_at = now()
  where user_id = auth.uid()
    and status = 'active'
    and expiry_date > now()
    and credits_remaining >= amount
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and access_status = 'approved'
    )
  returning * into result;
  if result.id is null then
    raise exception 'An approved account with an active subscription and sufficient credits is required';
  end if;
  insert into public.subscription_credit_ledger (user_id, subscription_id, action, credits_used, balance_after)
  values (auth.uid(), result.id, 'verification', amount, result.credits_remaining);
  return result;
end;
$$;

revoke all on function public.create_subscription_manual_payment(text, text) from public;
revoke all on function public.submit_subscription_manual_payment(uuid, text, text) from public;
revoke all on function public.approve_subscription_manual_payment(uuid) from public;
revoke all on function public.reject_subscription_manual_payment(uuid, text) from public;
revoke all on function public.consume_subscription_credits(integer) from public;
grant execute on function public.create_subscription_manual_payment(text, text) to authenticated;
grant execute on function public.submit_subscription_manual_payment(uuid, text, text) to authenticated;
grant execute on function public.approve_subscription_manual_payment(uuid) to authenticated;
grant execute on function public.reject_subscription_manual_payment(uuid, text) to authenticated;
grant execute on function public.consume_subscription_credits(integer) to authenticated;

commit;
