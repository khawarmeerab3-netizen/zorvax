-- 001: users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  first_name text,
  last_name text,
  birth_date date,
  birth_time time,
  birth_location text,
  timezone text default 'UTC',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists users_email_idx on public.users (lower(email));
