-- ============================================================
-- SMSAPI Dashboard - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Table: sms_logs
-- Stores all sent SMS messages
-- ============================================================
create table if not exists public.sms_logs (
  id            uuid primary key default uuid_generate_v4(),
  phone_number  text not null,
  message       text not null,
  sender_name   text not null default 'Test',
  status        text not null default 'PENDING',
  smsapi_id     text,
  points        numeric(10, 4),
  error_code    integer,
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for faster queries
create index if not exists sms_logs_created_at_idx on public.sms_logs(created_at desc);
create index if not exists sms_logs_phone_number_idx on public.sms_logs(phone_number);
create index if not exists sms_logs_status_idx on public.sms_logs(status);

-- ============================================================
-- Table: sms_templates
-- Stores reusable SMS templates
-- ============================================================
create table if not exists public.sms_templates (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- Function: update updated_at timestamp
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for sms_logs
create trigger sms_logs_updated_at
  before update on public.sms_logs
  for each row execute function public.handle_updated_at();

-- Trigger for sms_templates
create trigger sms_templates_updated_at
  before update on public.sms_templates
  for each row execute function public.handle_updated_at();

-- ============================================================
-- RLS (Row Level Security) - disabled for simplicity
-- Enable and configure if you add authentication
-- ============================================================
alter table public.sms_logs enable row level security;
alter table public.sms_templates enable row level security;

-- Allow all operations (adjust for production with proper auth)
create policy "Allow all on sms_logs" on public.sms_logs
  for all using (true) with check (true);

create policy "Allow all on sms_templates" on public.sms_templates
  for all using (true) with check (true);

-- ============================================================
-- Seed: sample templates
-- ============================================================
insert into public.sms_templates (name, content) values
  ('Salut client', 'Buna ziua! Va multumim ca ati ales serviciile noastre. Echipa KidGPS'),
  ('Confirmare comanda', 'Comanda dvs. a fost confirmata si va fi livrata in 24-48h. Multumim!'),
  ('Reminder plata', 'Va rugam sa efectuati plata pentru serviciile active. Detalii pe portal.')
on conflict (name) do nothing;
