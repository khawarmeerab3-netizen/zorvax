import { randomUUID } from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import type { Chart, NumerologyReading } from '@zorvax/shared';

/**
 * API-side Supabase access.
 *
 * Uses the service-role key (bypasses RLS — the API enforces ownership itself).
 * When SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured, every
 * helper transparently falls back to an in-memory store so the API runs with
 * zero setup in development and tests.
 */

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthLocation: string | null;
  timezone: string | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthLocation: string | null;
  timezone: string | null;
  locale: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  tier: 'free' | 'starter' | 'pro' | 'elite';
  stripeId: string | null;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

let cachedClient: SupabaseClient | null | undefined;

/** Supabase client, or null when not configured. */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    cachedClient = null;
    return null;
  }
  cachedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

/** True when real Supabase credentials are configured. */
export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

// ---------- in-memory fallback ----------

const memUsers = new Map<string, UserRecord>();
const memUsersByEmail = new Map<string, string>();
const memCharts = new Map<string, Chart>();
const memNumerology = new Map<string, NumerologyReading>();
const memSubscriptions = new Map<string, SubscriptionRecord>();

// ---------- row mapping ----------

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
  timezone: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    birthTime: row.birth_time,
    birthLocation: row.birth_location,
    timezone: row.timezone,
    locale: row.locale,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ChartRow {
  id: string;
  user_id: string;
  sun_sign: Chart['sunSign'];
  moon_sign: Chart['moonSign'];
  rising_sign: Chart['risingSign'];
  planets_json: Chart['planets'];
  houses_json: Chart['houses'];
  aspects_json: Chart['aspects'];
  precise: boolean;
  calculated_at: string;
  created_at: string;
}

function toChart(row: ChartRow): Chart {
  return {
    id: row.id,
    userId: row.user_id,
    sunSign: row.sun_sign,
    moonSign: row.moon_sign,
    risingSign: row.rising_sign,
    planets: row.planets_json,
    houses: row.houses_json,
    aspects: row.aspects_json,
    precise: row.precise,
    calculatedAt: row.calculated_at,
    createdAt: row.created_at,
  };
}

interface NumerologyRow {
  id: string;
  user_id: string;
  life_path: number;
  expression_number: number;
  soul_urge: number;
  personality_number: number;
  birthday_number: number;
  maturity_number: number;
  current_year_number: number;
  created_at: string;
}

function toNumerology(row: NumerologyRow): NumerologyReading {
  return {
    id: row.id,
    userId: row.user_id,
    lifePath: row.life_path,
    expressionNumber: row.expression_number,
    soulUrge: row.soul_urge,
    personalityNumber: row.personality_number,
    birthdayNumber: row.birthday_number,
    maturityNumber: row.maturity_number,
    currentYearNumber: row.current_year_number,
    createdAt: row.created_at,
  };
}

// ---------- users ----------

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error) throw error;
    return data ? toUserRecord(data as UserRow) : null;
  }
  const id = memUsersByEmail.get(email.toLowerCase());
  return id ? (memUsers.get(id) ?? null) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toUserRecord(data as UserRow) : null;
  }
  return memUsers.get(id) ?? null;
}

/** Alias required by the Chat 7 helper contract. */
export const getUser = findUserById;

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('users')
      .insert({
        email: input.email.toLowerCase(),
        password_hash: input.passwordHash,
        first_name: input.firstName,
        last_name: input.lastName,
        birth_date: input.birthDate,
        birth_time: input.birthTime,
        birth_location: input.birthLocation,
        timezone: input.timezone,
        locale: input.locale,
      })
      .select()
      .single();
    if (error) throw error;
    return toUserRecord(data as UserRow);
  }
  const now = new Date().toISOString();
  const record: UserRecord = {
    id: randomUUID(),
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthLocation: input.birthLocation,
    timezone: input.timezone,
    locale: input.locale,
    createdAt: now,
    updatedAt: now,
  };
  memUsers.set(record.id, record);
  memUsersByEmail.set(record.email, record.id);
  return record;
}

export async function updateUser(
  id: string,
  patch: Partial<Omit<UserRecord, 'id' | 'email' | 'passwordHash' | 'createdAt' | 'updatedAt'>>
): Promise<UserRecord> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('users')
      .update({
        first_name: patch.firstName ?? null,
        last_name: patch.lastName ?? null,
        birth_date: patch.birthDate ?? null,
        birth_time: patch.birthTime ?? null,
        birth_location: patch.birthLocation ?? null,
        timezone: patch.timezone ?? null,
        locale: patch.locale ?? 'en',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toUserRecord(data as UserRow);
  }
  const existing = memUsers.get(id);
  if (!existing) throw new Error('user not found');
  const updated: UserRecord = {
    ...existing,
    firstName: patch.firstName ?? null,
    lastName: patch.lastName ?? null,
    birthDate: patch.birthDate ?? null,
    birthTime: patch.birthTime ?? null,
    birthLocation: patch.birthLocation ?? null,
    timezone: patch.timezone ?? null,
    locale: patch.locale ?? existing.locale,
    updatedAt: new Date().toISOString(),
  };
  memUsers.set(id, updated);
  return updated;
}

// ---------- charts ----------

export async function createChart(chart: Chart): Promise<Chart> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('charts').insert({
      id: chart.id,
      user_id: chart.userId,
      sun_sign: chart.sunSign,
      moon_sign: chart.moonSign,
      rising_sign: chart.risingSign,
      planets_json: chart.planets,
      houses_json: chart.houses,
      aspects_json: chart.aspects,
      precise: chart.precise,
      calculated_at: chart.calculatedAt,
    });
    if (error) throw error;
    return chart;
  }
  memCharts.set(chart.id, chart);
  return chart;
}

export async function getChartById(id: string): Promise<Chart | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('charts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toChart(data as ChartRow) : null;
  }
  return memCharts.get(id) ?? null;
}

export async function getLatestChartByUser(userId: string): Promise<Chart | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('charts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toChart(data as ChartRow) : null;
  }
  const charts = [...memCharts.values()].filter((c) => c.userId === userId);
  charts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return charts[0] ?? null;
}

// ---------- numerology ----------

export async function saveNumerology(reading: NumerologyReading): Promise<NumerologyReading> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('numerology_readings').insert({
      id: reading.id,
      user_id: reading.userId,
      life_path: reading.lifePath,
      expression_number: reading.expressionNumber,
      soul_urge: reading.soulUrge,
      personality_number: reading.personalityNumber,
      birthday_number: reading.birthdayNumber,
      maturity_number: reading.maturityNumber,
      current_year_number: reading.currentYearNumber,
    });
    if (error) throw error;
    return reading;
  }
  memNumerology.set(reading.userId, reading);
  return reading;
}

/** Latest numerology reading for a user (alias: getNumerology). */
export async function getNumerologyByUser(userId: string): Promise<NumerologyReading | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('numerology_readings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toNumerology(data as NumerologyRow) : null;
  }
  return memNumerology.get(userId) ?? null;
}

/** Alias required by the Chat 7 helper contract. */
export const getNumerology = getNumerologyByUser;

// ---------- subscriptions ----------

/** Create (or replace) a subscription row for a user. */
export async function createSubscription(input: {
  userId: string;
  tier: SubscriptionRecord['tier'];
  stripeId?: string | null;
  status?: string;
}): Promise<SubscriptionRecord> {
  const record: SubscriptionRecord = {
    id: randomUUID(),
    userId: input.userId,
    tier: input.tier,
    stripeId: input.stripeId ?? null,
    status: input.status ?? 'active',
    currentPeriodStart: null,
    currentPeriodEnd: null,
  };
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('subscriptions').insert({
      id: record.id,
      user_id: record.userId,
      tier: record.tier,
      stripe_id: record.stripeId,
      status: record.status,
    });
    if (error) throw error;
    return record;
  }
  memSubscriptions.set(record.userId, record);
  return record;
}

export async function getSubscriptionByUser(userId: string): Promise<SubscriptionRecord | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as {
      id: string;
      user_id: string;
      tier: SubscriptionRecord['tier'];
      stripe_id: string | null;
      status: string;
      current_period_start: string | null;
      current_period_end: string | null;
    };
    return {
      id: row.id,
      userId: row.user_id,
      tier: row.tier,
      stripeId: row.stripe_id,
      status: row.status,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
    };
  }
  return memSubscriptions.get(userId) ?? null;
}

/** Test helper: clear the in-memory fallback store. */
export function __clearMemoryStore(): void {
  memUsers.clear();
  memUsersByEmail.clear();
  memCharts.clear();
  memNumerology.clear();
  memSubscriptions.clear();
}
