import { Errors } from './errors';
import { findUserById, updateUser } from '../lib/supabase';
import type { Profile, UpdateProfileInput } from '@zorvax/shared';

/** Load the public profile for a user. */
export async function getProfile(userId: string): Promise<Profile> {
  const user = await findUserById(userId);
  if (!user) throw Errors.userNotFound();
  return toProfile(user);
}

/** Update profile fields. */
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  const user = await findUserById(userId);
  if (!user) throw Errors.userNotFound();

  if (input.birthDate !== undefined && input.birthDate !== '' && !isValidDate(input.birthDate)) {
    throw Errors.invalidBirthDate();
  }

  const updated = await updateUser(userId, {
    firstName: input.firstName?.trim() || null,
    lastName: input.lastName?.trim() || null,
    birthDate: input.birthDate || null,
    birthTime: input.birthTime || null,
    birthLocation: input.birthLocation?.trim() || null,
    timezone: input.timezone || null,
    locale: input.locale || user.locale,
  });
  return toProfile(updated);
}

function isValidDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function toProfile(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  birthLocation: string | null;
  locale: string;
}): Profile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate,
    birthLocation: user.birthLocation,
    locale: user.locale,
    subscription: { tier: 'free', status: 'active', currentPeriodEnd: null },
  };
}
