import { createClient } from '@supabase/supabase-js';

/**
 * Privileged Supabase client — service-role key, server only.
 * NEVER import this file (or its result) into a Client Component.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceKey) {
    throw new Error('Supabase admin credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are not configured.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
