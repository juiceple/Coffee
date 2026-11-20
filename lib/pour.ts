import type { Step } from './types';

export type Pour = { ts: number; dur: number; rate: number; bloom: boolean };
export type Sim = { dt: number; S: number[]; D: number[]; IN: number[]; Q: number[]; pours: Pour[]; end: number };

export const POUR_RATE = 5; // g/s, 물줄기가 끊기지 않는 기준 유속

/** 붓기 계획 → 구간별 붓는 시간/유속 */
export function planPours(steps: Step[]): Pour[] {
  const pts = [...steps].sort((a, b) => a.t - b.t);
  const out: Pour[] = [];
  let prev = 0;
  pts.forEach((p, i) => {
    const gap = p.g - prev; prev = Math.max(prev, p.g);
    if (gap <= 0) return;
    const window = i + 1 < pts.length ? pts[i + 1].t - p.t : Infinity;
    const dur = Math.min(gap / POUR_RATE, window > 0 ? window : gap / POUR_RATE);
    if (dur <= 0) return;
    out.push({ ts: p.t, dur, rate: gap / dur, bloom: /뜸/.test(p.label) });
  });
  return out;
}

/**
 * 간단한 물리 모델: 커피가 원두 무게 2배의 물을 머금고, 그 이상(free)만 sqrt 비례로 빠진다.
 * S: 드리퍼 안 총 물(g), D: 서버에 떨어진 누적(g)
 */
export function simulate(steps: Step[], dose: number, kd = 0.25): Sim {
  const dt = 0.1, pours = planPours(steps);
  const pourEnd = pours.reduce((m, p) => Math.max(m, p.ts + p.dur), 0);
  const S: number[] = [], D: number[] = [], IN: number[] = [], Q: number[] = [];
  let s = 0, d = 0, t = 0, end = pourEnd;
  const absorb = 2 * dose;
  for (let i = 0; i < 9000; i++, t = i * dt) {
    const inflow = pours.find((p) => t >= p.ts && t < p.ts + p.dur)?.rate ?? 0;
    s += inflow * dt;
    const free = Math.max(0, s - Math.min(s, absorb));
    const q = Math.min(kd * Math.sqrt(free), free / dt);
    s -= q * dt; d += q * dt;
    S.push(s); D.push(d); IN.push(inflow); Q.push(q);
    if (t > pourEnd && free < 0.25) { end = t; break; }
    end = t;
  }
  return { dt, S, D, IN, Q, pours, end };
}

export const at = (a: number[], t: number, dt: number) => a[Math.min(a.length - 1, Math.max(0, Math.round(t / dt)))] ?? 0;

/** 붓는 위치 (-1..1 평면, 위에서 본 기준). 뜸: 중앙→바깥 나선, 이후: 안팎 오가는 원 */
export function pourPos(pours: Pour[], t: number) {
  const p = pours.find((q) => t >= q.ts && t < q.ts + q.dur);
  if (!p) return null;
  const u = (t - p.ts) / p.dur;
  const turns = Math.max(1, p.dur / 2.2);
  const th = 2 * Math.PI * turns * u;
  const r = p.bloom ? 0.1 + 0.7 * u : 0.15 + 0.6 * Math.sin(Math.PI * u);
  return { x: r * Math.cos(th), y: r * Math.sin(th), bloom: p.bloom, rate: p.rate };
}

/** 뜸 때 CO2로 커피층이 부푸는 정도 0..1 */
export function bloomAmount(pours: Pour[], t: number) {
  const b = pours.find((p) => p.bloom);
  if (!b || t < b.ts) return 0;
  const endT = b.ts + b.dur;
  if (t < endT) return (t - b.ts) / b.dur;
  return Math.exp(-(t - endT) / 22);
}
