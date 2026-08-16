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
  if purchase.status not in ('pending', 'paid', 'approved') then
    raise exception 'Purchase cannot be fulfilled';
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

  update public.purchases
  set status = 'fulfilled', fulfilled_at = now()
  where id = purchase.id
  returning * into purchase;
  return purchase;
end;
$$;

create or replace function public.approve_manual_payment(target_purchase_id uuid)
returns public.purchases
language plpgsql
security definer set search_path = public
as $$
declare
  purchase public.purchases;
  fulfilled public.purchases;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select * into purchase from public.purchases where id = target_purchase_id for update;
  if purchase.id is null then raise exception 'Purchase not found'; end if;
  if purchase.status = 'fulfilled' then return purchase; end if;
  if purchase.status <> 'submitted_for_review' or purchase.manual_transaction_reference is null then
    raise exception 'Purchase is not awaiting manual review';
  end if;

  update public.purchases
  set status = 'approved',
      provider_transaction_id = manual_transaction_reference,
      paid_at = now(),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = purchase.id;

  select * into fulfilled from public.fulfill_credit_purchase(
    purchase.id,
    purchase.provider,
    purchase.provider_reference,
    purchase.manual_transaction_reference,
    purchase.amount,
    purchase.currency
  );
  return fulfilled;
end;
$$;

revoke all on function public.fulfill_credit_purchase(uuid, text, text, text, numeric, text) from public;
revoke all on function public.approve_manual_payment(uuid) from public;
grant execute on function public.approve_manual_payment(uuid) to authenticated;
