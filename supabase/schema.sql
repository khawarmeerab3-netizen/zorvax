-- ============================================================
-- ZORVAX — complete PostgreSQL schema (Supabase)
-- Paste into the Supabase SQL editor, or run migrations/ in order.
-- ============================================================

-- ---------- users ----------
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

-- ---------- charts ----------
create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  sun_sign text not null,
  moon_sign text not null,
  rising_sign text not null,
  planets_json jsonb not null default '[]'::jsonb,
  houses_json jsonb not null default '[]'::jsonb,
  aspects_json jsonb not null default '[]'::jsonb,
  precise boolean not null default false,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists charts_user_id_idx on public.charts (user_id);

-- ---------- numerology_readings ----------
create table if not exists public.numerology_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  life_path int not null,
  expression_number int not null,
  soul_urge int not null,
  personality_number int not null,
  birthday_number int not null,
  maturity_number int not null,
  current_year_number int not null,
  created_at timestamptz not null default now()
);
create index if not exists numerology_user_id_idx on public.numerology_readings (user_id);

-- ---------- subscriptions ----------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'starter', 'pro', 'elite')),
  stripe_id text,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create unique index if not exists subscriptions_stripe_id_idx on public.subscriptions (stripe_id)
  where stripe_id is not null;

-- ---------- sessions ----------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions (user_id);

-- ---------- Row Level Security ----------
-- The API authenticates with custom JWTs and talks to Postgres through the
-- service-role key (which bypasses RLS). RLS is enabled with no permissive
-- policies so direct anon/authenticated client access is denied by default.
alter table public.users enable row level security;
alter table public.charts enable row level security;
alter table public.numerology_readings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.sessions enable row level security;

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_touch on public.users;
create trigger users_touch before update on public.users
  for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();
