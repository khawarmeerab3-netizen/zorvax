import { createBrowserClient } from '@supabase/ssr';

/** Supabase client for browser components. Safe to call in Client Components. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  );
}

/** Convenience: current signed-in user (Supabase Auth), or null. */
export async function getUser() {
  const client = createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}
