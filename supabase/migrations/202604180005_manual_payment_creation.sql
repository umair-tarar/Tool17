create or replace function public.create_manual_payment(
  requested_package_id text,
  requested_provider text
)
returns public.purchases
language plpgsql
security definer set search_path = public
as $$
declare
  purchase public.purchases;
  package_credits integer;
  package_amount numeric(12, 2);
  package_currency text := 'USD';
  reference text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if requested_provider not in ('visa_card', 'nayapay', 'easypaisa', 'jazzcash') then
    raise exception 'Unsupported payment provider';
  end if;

  if not exists (
    select 1
    from public.payment_instructions
    where provider = requested_provider
      and active = true
      and nullif(trim(display_name), '') is not null
      and nullif(trim(account_identifier), '') is not null
      and nullif(trim(instructions), '') is not null
  ) then
    raise exception 'Payment method is not currently available';
  end if;

  case requested_package_id
    when '10k' then package_credits := 10000; package_amount := 15.00;
    when '30k' then package_credits := 30000; package_amount := 45.00;
    when '50k' then package_credits := 50000; package_amount := 80.00;
    when '75k' then package_credits := 75000; package_amount := 120.00;
    when '100k' then package_credits := 100000; package_amount := 150.00;
    else raise exception 'Invalid credit package';
  end case;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text || ':' || requested_package_id));

  select * into purchase
  from public.purchases
  where user_id = auth.uid()
    and package_id = requested_package_id
    and status in ('pending_payment', 'submitted_for_review')
  for update;

  if purchase.id is not null then
    if purchase.provider <> requested_provider then
      raise exception 'A pending payment request already exists for this package';
    end if;
    return purchase;
  end if;

  reference := 'plv_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.purchases (
    user_id,
    package_id,
    credit_amount,
    amount,
    currency,
    provider,
    provider_reference,
    status
  )
  values (
    auth.uid(),
    requested_package_id,
    package_credits,
    package_amount,
    package_currency,
    requested_provider,
    reference,
    'pending_payment'
  )
  returning * into purchase;

  return purchase;
end;
$$;

revoke all on function public.create_manual_payment(text, text) from public;
grant execute on function public.create_manual_payment(text, text) to authenticated;
