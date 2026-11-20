-- 002: charts table
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
