create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  package_id text not null check (package_id in ('10k', '30k', '50k', '75k', '100k')),
  credit_amount integer not null check (credit_amount > 0),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  provider text not null check (provider in ('visa_card', 'nayapay', 'easypaisa', 'jazzcash')),
  provider_transaction_id text,
  provider_reference text not null,
  status text not null check (status in ('pending', 'paid', 'fulfilled', 'failed', 'cancelled', 'expired', 'refunded', 'reversed')),
  failure_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  fulfilled_at timestamptz,
  refunded_at timestamptz
);

create unique index if not exists purchases_provider_reference_key on public.purchases(provider, provider_reference);
create unique index if not exists purchases_provider_transaction_id_key on public.purchases(provider, provider_transaction_id) where provider_transaction_id is not null;
create index if not exists purchases_user_created_at_idx on public.purchases(user_id, created_at desc);
create index if not exists purchases_status_created_at_idx on public.purchases(status, created_at);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  credit_delta integer not null check (credit_delta <> 0),
  reason text not null check (reason in ('purchase', 'purchase_reversal')),
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  provider text not null check (provider in ('visa_card', 'nayapay', 'easypaisa', 'jazzcash')),
  provider_transaction_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_ledger_purchase_reason_key on public.credit_ledger(purchase_id, reason);
create index if not exists credit_ledger_user_created_at_idx on public.credit_ledger(user_id, created_at desc);

alter table public.purchases enable row level security;
alter table public.credit_ledger enable row level security;

create policy "Users can view their purchases" on public.purchases for select using (user_id = auth.uid());
create policy "Users can view their credit ledger" on public.credit_ledger for select using (user_id = auth.uid());

create or replace function public.fulfill_credit_purchase(
  target_purchase_id uuid,
  expected_provider text,
  expected_reference text,
  verified_transaction_id text,
  verified_amount numeric,
  verified_currency text
)
returns public.purchases
language plpgsql
security definer set search_path = public
as $$
declare
  purchase public.purchases;
begin
  select * into purchase from public.purchases where id = target_purchase_id for update;
  if purchase.id is null then raise exception 'Purchase not found'; end if;
  if purchase.provider <> expected_provider
    or purchase.provider_reference <> expected_reference
    or purchase.amount <> verified_amount
    or purchase.currency <> verified_currency then
    raise exception 'Verified payment does not match purchase';
  end if;
  if purchase.status = 'fulfilled' then
    if purchase.provider_transaction_id <> verified_transaction_id then
      raise exception 'Provider transaction does not match fulfilled purchase';
    end if;
    return purchase;
  end if;
  if purchase.status not in ('pending', 'paid') then raise exception 'Purchase cannot be fulfilled'; end if;

  update public.purchases
  set status = 'paid', provider_transaction_id = verified_transaction_id, paid_at = coalesce(paid_at, now())
  where id = purchase.id;

  insert into public.credit_ledger (user_id, credit_delta, reason, purchase_id, provider, provider_transaction_id)
  values (purchase.user_id, purchase.credit_amount, 'purchase', purchase.id, purchase.provider, verified_transaction_id)
  on conflict (purchase_id, reason) do nothing;

  if not found then
    select * into purchase from public.purchases where id = target_purchase_id;
    return purchase;
  end if;

  update public.credits
  set remaining = remaining + purchase.credit_amount, updated_at = now()
  where user_id = purchase.user_id;

  update public.purchases
  set status = 'fulfilled', fulfilled_at = now()
  where id = purchase.id
  returning * into purchase;
  return purchase;
end;
$$;

revoke all on function public.fulfill_credit_purchase(uuid, text, text, text, numeric, text) from public;
