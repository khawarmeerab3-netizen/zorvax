/** Numerology domain types (Pythagorean system). */

/** A complete numerology reading. */
export interface NumerologyReading {
  id: string;
  userId: string;
  /** 1–9, 11, 22, 33 */
  lifePath: number;
  expressionNumber: number;
  soulUrge: number;
  personalityNumber: number;
  birthdayNumber: number;
  maturityNumber: number;
  currentYearNumber: number;
  createdAt: string;
}

/** Input for a numerology calculation. */
export interface CalculateNumerologyInput {
  fullName: string;
  birthDate: string;
}

/** Breakdown of one numerology number. */
export interface NumerologyNumber {
  value: number;
  /** e.g. "Life Path" */
  label: string;
  /** Short plain-English meaning. */
  meaning: string;
  isMasterNumber: boolean;
}
