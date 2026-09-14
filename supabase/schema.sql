-- Run this in Supabase SQL Editor after `npx auth@latest migrate` creates Better Auth tables.
create table if not exists public.patient_history (
  id uuid primary key default gen_random_uuid(), user_id text not null, patient_name text not null,
  village text not null, priority text not null, notes text not null default '', created_at timestamptz not null default now()
);
create index if not exists patient_history_user_created_idx on public.patient_history (user_id, created_at desc);
