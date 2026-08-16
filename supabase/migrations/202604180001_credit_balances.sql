alter table public.credits add column if not exists base_credits integer not null default 200000 check (base_credits >= 0);
alter table public.credits add column if not exists extra_credits integer not null default 0 check (extra_credits >= 0);

update public.credits
set base_credits = 200000,
    extra_credits = coalesce((
      select sum(credit_delta)
      from public.credit_ledger
      where credit_ledger.user_id = credits.user_id
    ), 0),
    remaining = greatest(0, 200000 + coalesce((
      select sum(credit_delta)
      from public.credit_ledger
      where credit_ledger.user_id = credits.user_id
    ), 0) - used),
    updated_at = now();

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
  set extra_credits = extra_credits + purchase.credit_amount,
      remaining = remaining + purchase.credit_amount,
      updated_at = now()
  where user_id = purchase.user_id;

  update public.purchases
  set status = 'fulfilled', fulfilled_at = now()
  where id = purchase.id
  returning * into purchase;
  return purchase;
end;
$$;

create or replace function public.reverse_credit_purchase(
  target_purchase_id uuid,
  expected_provider text,
  expected_reference text,
  reversal_transaction_id text
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
  if purchase.provider <> expected_provider or purchase.provider_reference <> expected_reference then
    raise exception 'Verified reversal does not match purchase';
  end if;
  if purchase.status in ('refunded', 'reversed') then return purchase; end if;
  if purchase.status <> 'fulfilled' then raise exception 'Purchase cannot be reversed'; end if;

  insert into public.credit_ledger (user_id, credit_delta, reason, purchase_id, provider, provider_transaction_id)
  values (purchase.user_id, -purchase.credit_amount, 'purchase_reversal', purchase.id, purchase.provider, reversal_transaction_id)
  on conflict (purchase_id, reason) do nothing;

  if found then
    update public.credits
    set extra_credits = greatest(0, extra_credits - purchase.credit_amount),
        remaining = greatest(0, base_credits + greatest(0, extra_credits - purchase.credit_amount) - used),
        updated_at = now()
    where user_id = purchase.user_id;
  end if;

  update public.purchases
  set status = 'reversed', refunded_at = now()
  where id = purchase.id
  returning * into purchase;
  return purchase;
end;
$$;

revoke all on function public.fulfill_credit_purchase(uuid, text, text, text, numeric, text) from public;
revoke all on function public.reverse_credit_purchase(uuid, text, text, text) from public;
