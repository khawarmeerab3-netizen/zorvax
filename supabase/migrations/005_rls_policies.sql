-- 005: RLS policies + updated_at triggers
--
-- The API uses custom JWTs and connects with the service-role key
-- (which bypasses RLS). RLS stays enabled with no permissive policies,
-- so direct anon/authenticated access from clients is denied by default.

alter table public.users enable row level security;
alter table public.charts enable row level security;
alter table public.numerology_readings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.sessions enable row level security;

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
