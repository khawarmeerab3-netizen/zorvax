import { randomUUID } from 'crypto';
import { Errors } from './errors';
import type {
  Aspect,
  AspectType,
  CalculateChartInput,
  Chart,
  CompatibilityResult,
  House,
  Planet,
  PlanetName,
  ZodiacSign,
} from '@zorvax/shared';

const SIGNS: ZodiacSign[] = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

/** Tropical zodiac sign boundaries: [month, day] when the sign STARTS. */
const SIGN_CUSPS: Array<[number, number, ZodiacSign]> = [
  [1, 20, 'Aquarius'],
  [2, 19, 'Pisces'],
  [3, 21, 'Aries'],
  [4, 20, 'Taurus'],
  [5, 21, 'Gemini'],
  [6, 21, 'Cancer'],
  [7, 23, 'Leo'],
  [8, 23, 'Virgo'],
  [9, 23, 'Libra'],
  [10, 23, 'Scorpio'],
  [11, 22, 'Sagittarius'],
  [12, 22, 'Capricorn'],
];

/** Exact tropical Sun sign for a month/day. */
export function sunSignFromMonthDay(month: number, day: number): ZodiacSign {
  let sign: ZodiacSign = 'Capricorn';
  for (const [m, d, s] of SIGN_CUSPS) {
    if (month > m || (month === m && day >= d)) sign = s;
  }
  return sign;
}

function signFromLongitude(lon: number): ZodiacSign {
  const idx = Math.floor(((lon % 360) + 360) % 360 / 30);
  const sign = SIGNS[idx];
  if (!sign) throw new Error('unreachable');
  return sign;
}

const norm360 = (deg: number): number => ((deg % 360) + 360) % 360;
const rad = (deg: number): number => (deg * Math.PI) / 180;
const deg = (r: number): number => (r * 180) / Math.PI;

/** Julian day number for a UTC date. */
function julianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

interface OrbitalElements {
  name: PlanetName | 'Earth';
  N: number;
  i: number;
  w: number;
  a: number;
  e: number;
  M0: number;
  dM: number;
}

/** Low-precision orbital elements (J2000, degrees, AU, deg/day). */
const ELEMENTS: OrbitalElements[] = [
  { name: 'Mercury', N: 48.3313, i: 7.0047, w: 29.1241, a: 0.387098, e: 0.205635, M0: 168.6562, dM: 4.0923344368 },
  { name: 'Venus', N: 76.6799, i: 3.3946, w: 54.891, a: 0.72333, e: 0.006773, M0: 48.0052, dM: 1.6021304744 },
  { name: 'Earth', N: 0, i: 0, w: 282.9404, a: 1.0, e: 0.016709, M0: 356.047, dM: 0.9856002585 },
  { name: 'Mars', N: 49.5574, i: 1.8497, w: 286.5016, a: 1.523688, e: 0.093405, M0: 18.6021, dM: 0.5240207766 },
  { name: 'Jupiter', N: 100.4542, i: 1.303, w: 273.8777, a: 5.20256, e: 0.048498, M0: 19.895, dM: 0.0830853001 },
  { name: 'Saturn', N: 113.6634, i: 2.4886, w: 339.3939, a: 9.55475, e: 0.055546, M0: 316.967, dM: 0.0334442282 },
  { name: 'Uranus', N: 74.0005, i: 0.7733, w: 96.6612, a: 19.18171, e: 0.047318, M0: 142.5905, dM: 0.011725806 },
  { name: 'Neptune', N: 131.7806, i: 1.77, w: 273.1874, a: 30.05826, e: 0.008606, M0: 260.2471, dM: 0.005995147 },
  { name: 'Pluto', N: 110.2997, i: 17.1417, w: 113.8346, a: 39.482, e: 0.248827, M0: 238.929, dM: 0.003975 },
];

function heliocentric(el: OrbitalElements, d: number): { x: number; y: number } {
  const M = norm360(el.M0 + el.dM * d);
  // Solve Kepler's equation (2 iterations are plenty at this precision).
  let E = M + (180 / Math.PI) * el.e * Math.sin(rad(M));
  for (let k = 0; k < 2; k++) {
    E = E - (E - (180 / Math.PI) * el.e * Math.sin(rad(E)) - M) / (1 - el.e * Math.cos(rad(E)));
  }
  const xv = el.a * (Math.cos(rad(E)) - el.e);
  const yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(rad(E));
  const v = deg(Math.atan2(yv, xv));
  const r = Math.sqrt(xv * xv + yv * yv);
  const vw = v + el.w;
  const xh =
    r * (Math.cos(rad(el.N)) * Math.cos(rad(vw)) - Math.sin(rad(el.N)) * Math.sin(rad(vw)) * Math.cos(rad(el.i)));
  const yh =
    r * (Math.sin(rad(el.N)) * Math.cos(rad(vw)) + Math.cos(rad(el.N)) * Math.sin(rad(vw)) * Math.cos(rad(el.i)));
  return { x: xh, y: yh };
}

/** Geocentric ecliptic longitudes for the 10 bodies at `d` days after J2000. */
function longitudesAt(d: number): Record<PlanetName, number> {
  const earth = ELEMENTS.find((e) => e.name === 'Earth');
  if (!earth) throw new Error('unreachable');
  const eh = heliocentric(earth, d);
  const out = {} as Record<PlanetName, number>;

  for (const el of ELEMENTS) {
    if (el.name === 'Earth') continue;
    const ph = heliocentric(el, d);
    out[el.name] = norm360(deg(Math.atan2(ph.y - eh.y, ph.x - eh.x)));
  }
  // Sun's geocentric longitude = opposite of Earth's heliocentric position.
  out['Sun'] = norm360(deg(Math.atan2(-eh.y, -eh.x)));
  // Moon: mean longitude (low precision, ~±1°).
  out['Moon'] = norm360(218.3164477 + 13.17639648 * d);
  return out;
}

/** Ascendant estimate. Exact with birth time + location; here: time-of-day based. */
function ascendantLongitude(sunLon: number, birthTime?: string): number {
  if (birthTime) {
    const m = /^(\d{1,2}):(\d{2})/.exec(birthTime);
    if (m?.[1] !== undefined && m?.[2] !== undefined) {
      const hours = Number(m[1]) + Number(m[2]) / 60;
      // At ~06:00 the Ascendant ≈ Sun's longitude; it advances ~15°/hour.
      return norm360(sunLon + (hours - 6) * 15);
    }
  }
  return sunLon;
}

const ASPECTS: Array<{ type: AspectType; angle: number; orb: number }> = [
  { type: 'conjunction', angle: 0, orb: 8 },
  { type: 'sextile', angle: 60, orb: 4 },
  { type: 'square', angle: 90, orb: 6 },
  { type: 'trine', angle: 120, orb: 6 },
  { type: 'opposition', angle: 180, orb: 8 },
];

function separation(a: number, b: number): number {
  const diff = Math.abs(norm360(a) - norm360(b));
  return diff > 180 ? 360 - diff : diff;
}

function parseBirthDate(birthDate: string): { year: number; month: number; day: number } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw Errors.invalidBirthDate();
  const [y, m, d] = birthDate.split('-').map(Number) as [number, number, number];
  if (y === undefined || m === undefined || d === undefined || m < 1 || m > 12 || d < 1 || d > 31) {
    throw Errors.invalidBirthDate();
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) throw Errors.invalidBirthDate();
  return { year: y, month: m, day: d };
}

/**
 * Calculate a natal chart. Sun sign is exact (tropical zodiac); planetary
 * longitudes use simplified orbital elements (good to ~1°); houses and
 * Ascendant are time-of-day estimates. `precise` is always false until a
 * true ephemeris is wired in.
 */
export function calculateChart(input: CalculateChartInput, userId: string): Chart {
  const { year, month, day } = parseBirthDate(input.birthDate);
  const jd = julianDay(year, month, day);
  const d = jd - 2451545.0; // days since J2000

  const lon = longitudesAt(d);
  const lonTomorrow = longitudesAt(d + 1);

  const sunLon = lon['Sun'];
  if (sunLon === undefined) throw new Error('unreachable');
  const sunSign = sunSignFromMonthDay(month, day);
  const ascLon = ascendantLongitude(sunLon, input.birthTime);

  const order: PlanetName[] = [
    'Sun',
    'Moon',
    'Mercury',
    'Venus',
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
  ];

  const planets: Planet[] = order.map((name) => {
    const longitude = lon[name];
    const next = lonTomorrow[name];
    if (longitude === undefined || next === undefined) throw new Error('unreachable');
    const retrograde = name !== 'Sun' && name !== 'Moon' ? norm360(next - longitude) > 180 : false;
    const house = Math.floor(norm360(longitude - ascLon) / 30) + 1;
    const sign = name === 'Sun' ? sunSign : signFromLongitude(longitude);
    return {
      name,
      longitude: Math.round(longitude * 100) / 100,
      sign,
      degreeInSign: Math.round((longitude % 30) * 100) / 100,
      house,
      retrograde,
    };
  });

  const houses: House[] = Array.from({ length: 12 }, (_, i) => {
    const cusp = norm360(ascLon + i * 30);
    return { number: i + 1, sign: signFromLongitude(cusp), cusp: Math.round(cusp * 100) / 100 };
  });

  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if (!a || !b) continue;
      const sep = separation(a.longitude, b.longitude);
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= asp.orb) {
          const sepTomorrow = separation(lonTomorrow[a.name] ?? 0, lonTomorrow[b.name] ?? 0);
          aspects.push({
            planetA: a.name,
            planetB: b.name,
            type: asp.type,
            orb: Math.round(orb * 10) / 10,
            applying: sepTomorrow < sep,
          });
          break;
        }
      }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);

  const moon = planets.find((p) => p.name === 'Moon');
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId,
    sunSign,
    moonSign: moon?.sign ?? 'Aries',
    risingSign: signFromLongitude(ascLon),
    planets,
    houses,
    aspects,
    precise: false,
    calculatedAt: now,
    createdAt: now,
  };
}

function elementOf(sign: ZodiacSign): 'fire' | 'earth' | 'air' | 'water' {
  if (sign === 'Aries' || sign === 'Leo' || sign === 'Sagittarius') return 'fire';
  if (sign === 'Taurus' || sign === 'Virgo' || sign === 'Capricorn') return 'earth';
  if (sign === 'Gemini' || sign === 'Libra' || sign === 'Aquarius') return 'air';
  return 'water';
}

function elementHarmony(a: ZodiacSign, b: ZodiacSign): number {
  const ea = elementOf(a);
  const eb = elementOf(b);
  if (ea === eb) return 1;
  if ((ea === 'fire' && eb === 'air') || (ea === 'air' && eb === 'fire')) return 0.8;
  if ((ea === 'earth' && eb === 'water') || (ea === 'water' && eb === 'earth')) return 0.8;
  return 0.4;
}

function planetSign(chart: Chart, name: PlanetName): ZodiacSign {
  return chart.planets.find((p) => p.name === name)?.sign ?? 'Aries';
}

/** Rule-based compatibility between two charts. */
export function compatibility(personA: Chart, personB: Chart): CompatibilityResult {
  const sunA = personA.sunSign;
  const sunB = personB.sunSign;
  const moonA = personA.moonSign;
  const moonB = personB.moonSign;
  const venusA = planetSign(personA, 'Venus');
  const venusB = planetSign(personB, 'Venus');
  const marsA = planetSign(personA, 'Mars');
  const marsB = planetSign(personB, 'Mars');

  const sunScore = elementHarmony(sunA, sunB) * 25;
  const moonScore = elementHarmony(moonA, moonB) * 25;
  const venusMarsScore =
    ((elementHarmony(venusA, marsB) + elementHarmony(venusB, marsA)) / 2) * 25;
  const crossScore = ((elementHarmony(sunA, moonB) + elementHarmony(sunB, moonA)) / 2) * 25;
  const score = Math.round(sunScore + moonScore + venusMarsScore + crossScore);

  const strengths: string[] = [];
  const challenges: string[] = [];
  if (elementHarmony(sunA, sunB) >= 0.8)
    strengths.push(`${sunA} and ${sunB} Suns speak the same elemental language.`);
  else challenges.push(`${sunA} and ${sunB} Suns want different things — curiosity bridges it.`);
  if (elementHarmony(moonA, moonB) >= 0.8)
    strengths.push(`Emotional rhythms (${moonA} / ${moonB} Moons) feel like home.`);
  else challenges.push(`Different emotional needs (${moonA} vs ${moonB} Moon) need naming, not guessing.`);
  if (elementHarmony(venusA, venusB) >= 0.8)
    strengths.push('You love in compatible ways — affection lands easily.');
  else challenges.push('Love languages differ; ask for what you need directly.');

  return {
    score: Math.max(5, Math.min(99, score)),
    summary: `A ${score}/100 connection: ${sunA} Sun meets ${sunB} Sun, with ${moonA} and ${moonB} Moons coloring the emotional bond.`,
    sunMoon: `${sunA} Sun with ${moonB} Moon: ${
      elementHarmony(sunA, moonB) >= 0.8 ? 'natural ease' : 'growth through contrast'
    }; ${sunB} Sun with ${moonA} Moon: ${
      elementHarmony(sunB, moonA) >= 0.8 ? 'natural ease' : 'growth through contrast'
    }.`,
    venusMars: `${venusA} Venus dances with ${marsB} Mars (${
      elementHarmony(venusA, marsB) >= 0.8 ? 'magnetic' : 'intriguing friction'
    }); ${venusB} Venus with ${marsA} Mars mirrors it back.`,
    strengths: strengths.length > 0 ? strengths : ['A connection worth exploring with open eyes.'],
    challenges:
      challenges.length > 0 ? challenges : ['No major friction — keep communicating anyway.'],
  };
}
