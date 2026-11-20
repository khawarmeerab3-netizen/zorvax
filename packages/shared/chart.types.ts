/** Birth-chart domain types. */

/** The twelve zodiac signs. */
export type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

/** Classical + modern planets used in chart calculation. */
export type PlanetName =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto';

/** A planet's placement in a chart. */
export interface Planet {
  name: PlanetName;
  /** Ecliptic longitude in degrees (0–360). */
  longitude: number;
  sign: ZodiacSign;
  /** Degrees within the sign (0–30). */
  degreeInSign: number;
  /** 1–12 */
  house: number;
  retrograde: boolean;
}

/** A house cusp. */
export interface House {
  /** 1–12 */
  number: number;
  sign: ZodiacSign;
  /** Ecliptic longitude of the cusp. */
  cusp: number;
}

/** Major aspect types. */
export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

/** An aspect between two planets. */
export interface Aspect {
  planetA: PlanetName;
  planetB: PlanetName;
  type: AspectType;
  /** Orb in degrees. */
  orb: number;
  applying: boolean;
}

/** A computed natal chart. */
export interface Chart {
  id: string;
  userId: string;
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
  planets: Planet[];
  houses: House[];
  aspects: Aspect[];
  /** True when positions are astronomically precise; false for demo approximations. */
  precise: boolean;
  calculatedAt: string;
  createdAt: string;
}

/** Input for a chart calculation. */
export interface CalculateChartInput {
  birthDate: string;
  birthTime?: string;
  birthLocation?: string;
  timezone?: string;
}

/** Minimal chart context handed to Lyra so she never hallucinates placements. */
export interface UserChartContext {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
  planets: Array<Pick<Planet, 'name' | 'sign' | 'house' | 'retrograde'>>;
  dominantAspects: Aspect[];
}

/** Two-chart compatibility result. */
export interface CompatibilityResult {
  score: number;
  summary: string;
  sunMoon: string;
  venusMars: string;
  strengths: string[];
  challenges: string[];
}
