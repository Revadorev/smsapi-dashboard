-- ============================================================
-- SMSAPI Dashboard - awb_logs table
-- Run this in Supabase SQL Editor (project used by smsapi-dashboard)
-- ============================================================

create table if not exists public.awb_logs (
  id                uuid primary key default uuid_generate_v4(),
  awb_number        text not null,
  recipient_name    text not null,
  recipient_phone   text not null,
  recipient_email   text,
  recipient_address text not null,
  county_id         integer,
  city_id           integer,
  weight            numeric(10, 2),
  cost              numeric(10, 2),
  created_at        timestamptz not null default now()
);

create index if not exists awb_logs_created_at_idx on public.awb_logs(created_at desc);
create index if not exists awb_logs_awb_number_idx on public.awb_logs(awb_number);

alter table public.awb_logs enable row level security;

drop policy if exists "Allow all on awb_logs" on public.awb_logs;
create policy "Allow all on awb_logs" on public.awb_logs
  for all using (true) with check (true);
