/** User & profile domain types. */

/** Subscription tiers available in Zorvax. */
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'elite';

/** Subscription status. */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing';

/** A registered Zorvax user. */
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** ISO date, e.g. "1992-04-17" */
  birthDate: string | null;
  /** "HH:MM" 24h, nullable when unknown */
  birthTime: string | null;
  birthLocation: string | null;
  timezone: string | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

/** Public-facing profile (no secrets). */
export interface Profile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  birthLocation: string | null;
  locale: string;
  subscription: SubscriptionSummary | null;
}

/** Subscription summary attached to a profile. */
export interface SubscriptionSummary {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

/** Full subscription record. */
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  stripeId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for updating a user's profile. */
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  timezone?: string;
  locale?: string;
}
