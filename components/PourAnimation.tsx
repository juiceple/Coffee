'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Step } from '@/lib/types';
import { at, bloomAmount, pourPos, simulate } from '@/lib/pour';
import { fmt } from '@/lib/brew';

type Props = { steps: Step[]; dose: number; water: number; dripper: string; live: boolean; liveElapsed: number };

const CX = 150;
const COFFEE = '#5b3a29', SLURRY = '#8a5a35', BREW = '#4a2c1d', WATER = '#9cc9e8';

export default function PourAnimation({ steps, dose, water, dripper, live, liveElapsed }: Props) {
  const sim = useMemo(() => simulate(steps, dose || 15), [steps, dose]);
  const [pt, setPt] = useState(0);
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(2);
  const last = useRef(0);

  useEffect(() => {
    if (!play) return;
    let raf = 0; last.current = performance.now();
    const loop = (n: number) => {
      const dtS = ((n - last.current) / 1000) * speed; last.current = n;
      setPt((v) => { const nv = v + dtS; if (nv >= sim.end + 2) { setPlay(false); return sim.end + 2; } return nv; });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [play, speed, sim.end]);

  const t = live ? liveElapsed : pt;
  const S = at(sim.S, t, sim.dt), D = at(sim.D, t, sim.dt), IN = at(sim.IN, t, sim.dt), Q = at(sim.Q, t, sim.dt);
  const finalD = Math.max(1, sim.D[sim.D.length - 1]);
  const wave = dripper.includes('웨이브');

  /* 드리퍼 형상 */
  const top = wave ? 112 : 100, bot = wave ? 200 : 215, H = bot - top;
  const hwTop = wave ? 80 : 85, hwBot = wave ? 42 : 8;
  const hw = (y: number) => hwBot + ((hwTop - hwBot) * (bot - y)) / H;
  const poly = (inset: number) => `${CX - hwTop + inset},${top} ${CX + hwTop - inset},${top} ${CX + hwBot - inset / 2},${bot} ${CX - hwBot + inset / 2},${bot}`;

  const cap = Math.max(water * 1.2, 300);
  const frac = Math.min(1, S / cap);
  const levelH = H * (wave ? Math.pow(frac, 0.85) : Math.cbrt(frac));
  const bedH = H * (wave ? 0.22 : 0.3);
  const surfaceH = Math.max(levelH, bedH);
  const bloom = bloomAmount(sim.pours, t);
  const dome = bloom * 11;
  const surfaceY = bot - surfaceH;

  /* 붓는 위치 / 주전자 */
  const pos = IN > 0 ? pourPos(sim.pours, t) : null;
  const tipX = CX + (pos ? pos.x * 42 : 0);
  const tipY = 56;
  const tilt = IN > 0 ? 20 : 4;
  const sw = 1.6 + IN * 0.45;

  /* 서버 */
  const sTop = 240, sBot = 314, sH = sBot - sTop - 4;
  const fillH = Math.min(1, D / finalD) * sH;

  /* 위에서 본 궤적 */
  const trail: string[] = [];
  for (let k = 40; k >= 0; k--) {
    const p = pourPos(sim.pours, t - k * 0.1);
    if (p) trail.push(`${46 + p.x * 30},${62 + p.y * 30}`);
  }

  const phase = t < 0.05 && !live ? '준비'
    : IN > 0 ? (pos?.bloom ? '뜸 붓기' : '붓는 중')
    : t < sim.end ? (bloom > 0.05 && S < water * 0.3 ? '뜸 들이는 중' : Q > 0.05 ? '드로다운' : '대기') : '완료';

  return (
    <div>
      <svg viewBox="0 0 300 330" width="100%" role="img" aria-label="물 붓기 애니메이션" style={{ maxHeight: 420 }}>
        <defs><clipPath id="cone"><polygon points={poly(3)} /></clipPath></defs>

        {/* 위에서 본 궤적 */}
        <circle cx={46} cy={62} r={34} fill={COFFEE} opacity={0.85} />
        <circle cx={46} cy={62} r={34} fill="none" stroke="var(--line)" />
        {trail.length > 1 && <polyline points={trail.join(' ')} fill="none" stroke={WATER} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
        {pos && <circle cx={46 + pos.x * 30} cy={62 + pos.y * 30} r={3.5} fill="#fff" />}
        <text x={46} y={18} textAnchor="middle">위에서 본 붓기</text>

        {/* 서버 */}
        <rect x={105} y={sTop} width={90} height={sBot - sTop} rx={8} fill="none" stroke="var(--mute)" strokeWidth={2} />
        <rect x={108} y={sBot - 2 - fillH} width={84} height={fillH} rx={5} fill={BREW} />
        <text x={150} y={sBot + 14} textAnchor="middle">서버 {D.toFixed(0)}g</text>

        {/* 드리퍼 목 + 방울 */}
        <rect x={CX - hwBot - 3} y={bot} width={hwBot * 2 + 6} height={sTop - bot + 6} fill="var(--mute)" opacity={0.45} />
        {Q > 0.05 && (Q > 1.8
          ? <line x1={CX} x2={CX} y1={bot} y2={sBot - 2 - fillH} stroke={BREW} strokeWidth={1.8} />
          : [0, 1, 2].map((i) => { const ph = (t * (1 + Q * 2) + i / 3) % 1; return <circle key={i} cx={CX} cy={bot + 4 + ph * (sBot - fillH - bot - 6)} r={2.2} fill={BREW} />; }))}

        {/* 드리퍼 + 필터 + 커피층 */}
        <polygon points={poly(0)} fill="var(--card)" stroke="var(--mute)" strokeWidth={3} />
        <polygon points={poly(3)} fill="#f4efe6" opacity={0.9} />
        <g clipPath="url(#cone)">
          <rect x={CX - 100} y={bot - bedH} width={200} height={bedH + 2} fill={COFFEE} />
          <ellipse cx={CX} cy={bot - bedH} rx={hw(bot - bedH)} ry={Math.max(0.1, dome * 0.9)} fill={COFFEE} />
          {surfaceH > 1 && <rect x={CX - 100} y={surfaceY - dome} width={200} height={surfaceH + dome + 2} fill={SLURRY} opacity={0.62} />}
          {bloom > 0.12 && Array.from({ length: 9 }, (_, i) => {
            const bx = CX + (((i * 37) % 70) - 35), by = bot - bedH - dome * 0.6 - ((t * 7 + i * 5) % 9);
            return <circle key={i} cx={bx} cy={by} r={1.3 + (i % 3) * 0.6} fill="#e8d3b0" opacity={Math.min(1, bloom * 1.2)} />;
          })}
        </g>
        {wave && [-24, 0, 24].map((dx) => <circle key={dx} cx={CX + dx} cy={bot} r={2.5} fill="var(--bad)" />)}

        {/* 물줄기 */}
        {IN > 0 && (
          <g>
            <line x1={tipX} x2={tipX} y1={tipY} y2={surfaceY - dome} stroke={WATER} strokeWidth={sw} strokeLinecap="round" />
            <line x1={tipX} x2={tipX} y1={tipY} y2={surfaceY - dome} stroke="#fff" strokeWidth={sw * 0.4} strokeDasharray="5 7" strokeDashoffset={-t * 90} opacity={0.8} />
            {[0, 0.5].map((o) => { const k = (t * 2 + o) % 1; return <ellipse key={o} cx={tipX} cy={surfaceY - dome} rx={4 + k * 16} ry={1 + k * 3} fill="none" stroke="#fff" strokeOpacity={1 - k} />; })}
          </g>
        )}

        {/* 주전자 */}
        <g transform={`translate(${tipX} ${tipY}) rotate(${-tilt})`}>
          <path d="M22,-26 Q4,-28 0,-2" fill="none" stroke="#2f2f33" strokeWidth={5} strokeLinecap="round" />
          <rect x={18} y={-54} width={64} height={44} rx={10} fill="#2f2f33" />
          <path d="M82,-46 Q104,-46 102,-26 Q100,-12 82,-16" fill="none" stroke="#2f2f33" strokeWidth={4} strokeLinecap="round" />
          <circle cx={50} cy={-58} r={4} fill="#2f2f33" />
          <rect x={24} y={-44} width={52} height={5} rx={2} fill="#fff" opacity={0.15} />
        </g>

        <text x={8} y={262} style={{ fontSize: 15, fontWeight: 700, fill: 'var(--ink)' }}>{fmt(t)}</text>
        <text x={8} y={279} style={{ fill: 'var(--accent)', fontWeight: 600 }}>{phase}</text>
        <text x={8} y={294}>드리퍼 {S.toFixed(0)}g</text>
      </svg>

      <div className="row" style={{ marginTop: 4 }}>
        {live ? <span className="mute">추출 타이머에 맞춰 움직이는 중</span> : (<>
          <button className="btn sm" onClick={() => { if (pt >= sim.end + 2) setPt(0); setPlay(!play); }}>{play ? '⏸' : '▶'} 미리보기</button>
          <button className="btn sm" onClick={() => { setPlay(false); setPt(0); }}>처음</button>
          {[1, 2, 4].map((s) => <span key={s} className={`chip ${speed === s ? 'on' : ''}`} onClick={() => setSpeed(s)} style={{ margin: 0 }}>{s}x</span>)}
        </>)}
      </div>
      {!live && <input type="range" min={0} max={Math.ceil(sim.end + 2)} step={0.1} value={Math.min(pt, sim.end + 2)} onChange={(e) => { setPlay(false); setPt(+e.target.value); }} aria-label="시간 이동" />}
      <p className="mute" style={{ margin: '4px 0 0' }}>붓기 계획을 바탕으로 한 시뮬레이션이에요. 커피가 원두의 약 2배 물을 머금은 뒤부터 서버로 빠지고, 뜸 때는 가스로 커피층이 부풀어요. 실제 드로다운은 분쇄·필터에 따라 달라요.</p>
    </div>
  );
}
