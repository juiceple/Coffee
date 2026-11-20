import { AXES, type Taste } from '@/lib/types';

export default function Radar({ taste, size = 140 }: { taste: Taste; size?: number }) {
  const c = size / 2, R = c - 22, n = AXES.length;
  const P = (i: number, v: number): [number, number] => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [c + ((R * v) / 5) * Math.cos(a), c + ((R * v) / 5) * Math.sin(a)];
  };
  const ring = (v: number) => AXES.map((_, i) => P(i, v).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="맛 레이더">
      {[1, 2, 3, 4, 5].map((v) => <polygon key={v} points={ring(v)} fill="none" stroke="var(--line)" />)}
      <polygon points={AXES.map(([k], i) => P(i, taste[k]).join(',')).join(' ')} fill="var(--chart)" fillOpacity={0.3} stroke="var(--chart)" strokeWidth={2} />
      {AXES.map(([k, l], i) => { const [x, y] = P(i, 6.3); return <text key={k} x={x} y={y + 4} textAnchor="middle">{l}</text>; })}
    </svg>
  );
}
