-- 0011_payments_table.sql
-- Tracks successful Razorpay support contributions.
-- Records are inserted ONLY after server-side signature verification
-- (see /api/payments/verify). Failed / pending payments are never stored.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  razorpay_payment_id text not null unique,
  razorpay_order_id text not null,
  amount integer not null,                 -- amount in paise
  currency text not null default 'INR',
  donor_name text,
  donor_email text,
  status text not null default 'captured',
  created_at timestamptz not null default now()
);

create index if not exists payments_created_at_idx
  on public.payments (created_at desc);

create index if not exists payments_order_id_idx
  on public.payments (razorpay_order_id);

-- Row-level security: no one reads from the client. Inserts happen
-- via the service-role key from the server-side /api/payments/verify
-- route, which bypasses RLS. Deny-by-default for anon/authenticated.
alter table public.payments enable row level security;

-- Explicit "no client access" policies (deny-all by omission would also
-- work, but having explicit policies makes intent visible in dashboard).
drop policy if exists "payments_no_select" on public.payments;
drop policy if exists "payments_no_insert" on public.payments;
drop policy if exists "payments_no_update" on public.payments;
drop policy if exists "payments_no_delete" on public.payments;

create policy "payments_no_select" on public.payments
  for select to anon, authenticated using (false);

create policy "payments_no_insert" on public.payments
  for insert to anon, authenticated with check (false);

create policy "payments_no_update" on public.payments
  for update to anon, authenticated using (false) with check (false);

create policy "payments_no_delete" on public.payments
  for delete to anon, authenticated using (false);
