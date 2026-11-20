-- 003: numerology_readings table
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
