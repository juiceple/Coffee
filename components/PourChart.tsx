import type { Step } from '@/lib/types';

export default function PourChart({ steps, water, elapsed }: { steps: Step[]; water: number; elapsed: number }) {
  const W = 320, H = 150, L = 34, R = 8, T = 10, B = 24;
  const pts = [...steps].sort((a, b) => a.t - b.t);
  const maxW = Math.max(water, ...pts.map((p) => p.g), 1);
  const maxT = Math.max(180, ...pts.map((p) => p.t)) + 30;
  const x = (t: number) => L + ((W - L - R) * t) / maxT;
  const y = (g: number) => H - B - ((H - B - T) * g) / maxW;
  let d = '', prev = 0;
  pts.forEach((p, i) => {
    d += i === 0 ? `M${x(0)},${y(0)} L${x(p.t)},${y(0)}` : ` L${x(p.t)},${y(prev)}`;
    d += ` L${x(p.t + Math.max((p.g - prev) / 5, 0))},${y(p.g)}`; // 초당 5g 가정
    prev = p.g;
  });
  const xt = []; for (let t = 0; t <= maxT; t += 60) xt.push(t);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="시간에 따른 누적 물량 그래프">
      {xt.map((t) => (<g key={t}><line x1={x(t)} x2={x(t)} y1={T} y2={H - B} stroke="var(--line)" /><text x={x(t)} y={H - 8} textAnchor="middle">{Math.floor(t / 60)}:{String(t % 60).padStart(2, '0')}</text></g>))}
      {[0, 1, 2, 3].map((i) => { const v = (maxW * i) / 3; return (<g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={L - 4} y={y(v) + 4} textAnchor="end">{Math.round(v)}</text></g>); })}
      <path d={d} fill="none" stroke="var(--chart)" strokeWidth={2.5} />
      {pts.map((p, i) => <circle key={i} cx={x(p.t)} cy={y(p.g)} r={3.5} fill="var(--chart)" />)}
      {elapsed > 0 && <line x1={x(elapsed)} x2={x(elapsed)} y1={T} y2={H - B} stroke="var(--bad)" strokeWidth={1.5} />}
    </svg>
  );
}
