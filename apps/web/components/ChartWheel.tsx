import type { Chart } from '@zorvax/shared';

const SIGN_ORDER = [
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

/** Simple natal-wheel SVG: 12 sign segments + planet dots by longitude. */
export function ChartWheel({ chart }: { chart: Chart }) {
  const cx = 160;
  const cy = 160;
  const r = 130;
  const glyphs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  return (
    <svg viewBox="0 0 320 320" className="mx-auto w-full max-w-sm">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r - 34} fill="none" stroke="#334155" strokeWidth="1" />
      {SIGN_ORDER.map((_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(a);
        const y1 = cy + r * Math.sin(a);
        const x2 = cx + (r - 34) * Math.cos(a);
        const y2 = cy + (r - 34) * Math.sin(a);
        const gx = cx + (r - 17) * Math.cos(a + Math.PI / 12);
        const gy = cy + (r - 17) * Math.sin(a + Math.PI / 12);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="1" />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#a78bfa">
              {glyphs[i]}
            </text>
          </g>
        );
      })}
      {chart.planets.map((p) => {
        const a = ((p.longitude - 90) * Math.PI) / 180;
        const px = cx + (r - 58) * Math.cos(a);
        const py = cy + (r - 58) * Math.sin(a);
        return (
          <g key={p.name}>
            <circle cx={px} cy={py} r="4" fill="#ec4899" />
            <title>{`${p.name} in ${p.sign}`}</title>
          </g>
        );
      })}
    </svg>
  );
}
