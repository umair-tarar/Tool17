alter table public.purchases
  add column if not exists manual_transaction_reference text;

create unique index if not exists purchases_one_active_manual_request_per_package_key
  on public.purchases(user_id, package_id)
  where status in ('pending_payment', 'submitted_for_review');

create or replace function public.submit_manual_payment(
  target_purchase_id uuid,
  submitted_transaction_reference text,
  submitted_note text default null
)
returns public.purchases
language plpgsql
security definer set search_path = public
as $$
declare
  purchase public.purchases;
  reference text := nullif(trim(submitted_transaction_reference), '');
begin
  if reference is null then
    raise exception 'Transaction reference is required';
  end if;

  select * into purchase
  from public.purchases
  where id = target_purchase_id
    and user_id = auth.uid()
  for update;

  if purchase.id is null then
    raise exception 'Purchase not found';
  end if;

  if purchase.status = 'submitted_for_review' then
    if purchase.manual_transaction_reference = reference then
      return purchase;
    end if;
    raise exception 'Purchase has already been submitted for review';
  end if;

  if purchase.status <> 'pending_payment' then
    raise exception 'Purchase cannot be submitted';
  end if;

  update public.purchases
  set status = 'submitted_for_review',
      manual_transaction_reference = reference,
      manual_note = nullif(trim(coalesce(submitted_note, '')), ''),
      submitted_at = now()
  where id = purchase.id
  returning * into purchase;

  return purchase;
end;
$$;

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
  if purchase.status <> 'approved' then
    raise exception 'Purchase must be approved before fulfillment';
  end if;

  update public.purchases
  set provider_transaction_id = verified_transaction_id,
      paid_at = coalesce(paid_at, now())
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

  if not found then
    raise exception 'Credit balance not found for purchase user';
  end if;

  update public.purchases
  set status = 'fulfilled', fulfilled_at = now()
  where id = purchase.id
  returning * into purchase;
  return purchase;
end;
$$;

revoke all on function public.submit_manual_payment(uuid, text, text) from public;
grant execute on function public.submit_manual_payment(uuid, text, text) to authenticated;
revoke all on function public.fulfill_credit_purchase(uuid, text, text, text, numeric, text) from public;
