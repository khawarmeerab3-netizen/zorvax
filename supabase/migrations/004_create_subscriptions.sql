-- 004: subscriptions + sessions tables
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

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions (user_id);
