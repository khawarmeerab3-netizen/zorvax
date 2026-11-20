-- Seed data for local development.
-- Demo login: demo@zorvax.app / zorvax-demo-1234
-- (Change or remove before going live.)

insert into public.users (email, password_hash, first_name, birth_date, birth_location, locale)
values (
  'demo@zorvax.app',
  '$2b$10$Lo4IrWbxDD.LIM4SEYJEnuaHfbm7eNf39HCOb4Ow0P78jhqoZ/41C',
  'Nova',
  '1992-04-17',
  'Austin, USA',
  'en'
)
on conflict (email) do nothing;
