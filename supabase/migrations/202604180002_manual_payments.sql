alter table public.purchases add column if not exists manual_transaction_reference text;
alter table public.purchases add column if not exists manual_note text;
alter table public.purchases add column if not exists submitted_at timestamptz;
alter table public.purchases add column if not exists rejection_reason text;
alter table public.purchases add column if not exists reviewed_by uuid references public.profiles(id) on delete restrict;
alter table public.purchases add column if not exists reviewed_at timestamptz;

alter table public.purchases drop constraint if exists purchases_status_check;
alter table public.purchases add constraint purchases_status_check
  check (status in ('pending', 'pending_payment', 'submitted_for_review', 'approved', 'paid', 'fulfilled', 'rejected', 'cancelled', 'failed', 'expired', 'refunded', 'reversed'));

create table if not exists public.payment_instructions (
  provider text primary key check (provider in ('visa_card', 'nayapay', 'easypaisa', 'jazzcash')),
  display_name text not null,
  account_identifier text not null,
  instructions text not null,
  account_holder text,
  active boolean not null default false,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

alter table public.payment_instructions enable row level security;
create policy "Users can view active payment instructions" on public.payment_instructions
  for select using (active = true and auth.uid() is not null);
create policy "Admins can view all payment instructions" on public.payment_instructions
  for select using (public.is_admin());
create policy "Admins can manage payment instructions" on public.payment_instructions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can view all purchases" on public.purchases
  for select using (public.is_admin());

create or replace function public.submit_manual_payment(
  target_purchase_id uuid,
  submitted_transaction_reference text,
  submitted_note text default null
)
returns public.purchases
language plpgsql
security definer set search_path = public
as $$
declare result public.purchases;
begin
  if submitted_transaction_reference is null or length(trim(submitted_transaction_reference)) = 0 then
    raise exception 'Transaction reference is required';
  end if;
  update public.purchases
  set status = 'submitted_for_review',
      manual_transaction_reference = trim(submitted_transaction_reference),
      manual_note = nullif(trim(coalesce(submitted_note, '')), ''),
      submitted_at = now()
  where id = target_purchase_id
    and user_id = auth.uid()
    and status = 'pending_payment'
  returning * into result;
  if result.id is null then raise exception 'Purchase cannot be submitted'; end if;
  return result;
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
  set status = 'paid',
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

create or replace function public.reject_manual_payment(
  target_purchase_id uuid,
  reason text
)
returns public.purchases
language plpgsql
security definer set search_path = public
as $$
declare result public.purchases;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if reason is null or length(trim(reason)) = 0 then raise exception 'Rejection reason is required'; end if;
  update public.purchases
  set status = 'rejected', rejection_reason = trim(reason), reviewed_by = auth.uid(), reviewed_at = now()
  where id = target_purchase_id and status = 'submitted_for_review'
  returning * into result;
  if result.id is null then raise exception 'Purchase is not awaiting manual review'; end if;
  return result;
end;
$$;

revoke all on function public.submit_manual_payment(uuid, text, text) from public;
grant execute on function public.submit_manual_payment(uuid, text, text) to authenticated;
revoke all on function public.approve_manual_payment(uuid) from public;
grant execute on function public.approve_manual_payment(uuid) to authenticated;
revoke all on function public.reject_manual_payment(uuid, text) from public;
grant execute on function public.reject_manual_payment(uuid, text) to authenticated;

create index if not exists purchases_manual_review_idx on public.purchases(status, submitted_at desc);
