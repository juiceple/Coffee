'use client';
import { useEffect, useRef, useState } from 'react';
import PourChart from './PourChart';
import PourAnimation from './PourAnimation';
import { TEMPLATES, fmt, templateSteps, type TemplateId } from '@/lib/brew';
import { ROASTS, recommend } from '@/lib/coffee';
import type { Step } from '@/lib/types';
import type { Phase } from './BrewApp';

export type Form = {
  bean: string; roast: string; roastDate: string; dripper: string; filter: string;
  dose: string; water: string; temp: string; grind: string; steps: Step[]; edited: boolean;
};
type Props = { form: Form; setForm: (f: Form) => void; phase: Phase; setPhase: (p: Phase) => void; onDone: (seconds: number) => void };

const Num = ({ label, unit, value, step, onChange }: { label: string; unit: string; value: string; step: number; onChange: (v: string) => void }) => {
  const bump = (d: number) => onChange(String(Math.max(0, Math.round(((parseFloat(value) || 0) + d) * 10) / 10)));
  return (
    <div className="num">
      <label>{label} <span>{unit}</span></label>
      <input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} (${unit})`} />
      <div className="pm">
        <button aria-label={`${label} 줄이기`} onClick={() => bump(-step)}>−</button>
        <button aria-label={`${label} 늘리기`} onClick={() => bump(step)}>+</button>
      </div>
    </div>
  );
};

export default function BrewTab({ form, setForm, phase, setPhase, onDone }: Props) {
  const [tpl, setTpl] = useState<TemplateId>('v60-3');
  const [bloom, setBloom] = useState({ sec: 40, mul: 2 }); // 추천 적용 시 뜸 설정 유지
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const base = useRef(0), t0 = useRef(0), raf = useRef(0), wake = useRef<WakeLockSentinel | null>(null);

  const dose = parseFloat(form.dose) || 0, water = parseFloat(form.water) || 0;
  const set = (p: Partial<Form>) => setForm({ ...form, ...p });
  const regen = (id = tpl, d = dose, w = water) => ({ steps: templateSteps(id, d, w, bloom.sec, bloom.mul), edited: false });
  const setNum = (k: 'dose' | 'water', v: string) => {
    const d = k === 'dose' ? parseFloat(v) || 0 : dose, w = k === 'water' ? parseFloat(v) || 0 : water;
    set({ [k]: v, ...(form.edited ? {} : regen(tpl, d, w)) } as Partial<Form>);
  };
  const rec = recommend(form.roast, form.dripper, form.roastDate);
  const applyRec = () => {
    if (!rec || !dose) return;
    const w = rec.waterFor(dose);
    setTpl(rec.tpl); setBloom({ sec: rec.bloom, mul: rec.bloomMul });
    set({ temp: String(rec.tempMid), water: String(w), steps: templateSteps(rec.tpl, dose, w, rec.bloom, rec.bloomMul), edited: false });
  };
  const setStep = (i: number, p: Partial<Step>) =>
    set({ steps: form.steps.map((s, j) => (j === i ? { ...s, ...p } : s)), edited: true });

  /* 타이머 */
  const now = () => base.current + (running ? (performance.now() - t0.current) / 1000 : 0);
  useEffect(() => {
    if (!running) return;
    const loop = () => { setElapsed(base.current + (performance.now() - t0.current) / 1000); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running]);
  useEffect(() => () => { wake.current?.release().catch(() => {}); }, []);
  const lock = async (on: boolean) => {
    try {
      if (on && 'wakeLock' in navigator) wake.current = await navigator.wakeLock.request('screen');
      else { await wake.current?.release(); wake.current = null; }
    } catch {}
  };
  const toggle = () => {
    if (running) { base.current = now(); setElapsed(base.current); setRunning(false); lock(false); }
    else { t0.current = performance.now(); setRunning(true); lock(true); }
  };
  const reset = () => { setRunning(false); base.current = 0; setElapsed(0); lock(false); };
  const done = () => { const e = Math.round(now()); setRunning(false); base.current = e; setElapsed(e); lock(false); onDone(e); };

  const pts = [...form.steps].sort((a, b) => a.t - b.t);
  let idx = -1; pts.forEach((p, i) => { if (elapsed >= p.t) idx = i; });
  const cur = pts[idx], next = pts[idx + 1];

  const hints: string[] = [];
  if (pts[0] && dose && /뜸/.test(pts[0].label) && Math.abs(pts[0].g / dose - 2) > 0.6)
    hints.push(`뜸 물이 원두의 ${(pts[0].g / dose).toFixed(1)}배예요. 보통 약 2배(${Math.round(dose * 2)}g)를 씁니다.`);
  if (pts.some((p, i) => i && p.t > pts[i - 1].t && (p.g - pts[i - 1].g) / (p.t - pts[i - 1].t) > 5))
    hints.push('어떤 구간은 초당 5g보다 빠르게 부어야 해요. 시간을 늘리거나 단계를 나누면 편해요.');

  const summary = `${form.bean || '이름 없는 원두'} · ${form.dripper} · ${dose}g → ${water}g`;
  const started = running || elapsed > 0;

  /* ───────── 1. 레시피 ───────── */
  if (phase !== 'brew') return (
    <>
      <div className="card">
        <label htmlFor="bean">오늘 내릴 원두</label>
        <input id="bean" className="big" value={form.bean} onChange={(e) => set({ bean: e.target.value })} placeholder="예: 에티오피아 구지 · 로스터" />
        <div className="sp" />
        <label>드리퍼</label>
        <div className="seg" role="group" aria-label="드리퍼">
          {['V60', '칼리타 웨이브', '기타'].map((r) => <button key={r} className={form.dripper === r ? 'on' : ''} onClick={() => set({ dripper: r })}>{r}</button>)}
        </div>
      </div>

      <div className="card">
        <h2>로스팅 · 추출 전략 추천</h2>
        <div className="chips" role="group" aria-label="로스팅 단계">
          {ROASTS.map((r) => <button key={r} className={`chip ${form.roast === r ? 'on' : ''}`} onClick={() => set({ roast: r })}>{r}</button>)}
        </div>
        {rec && (
          <div className="rec">
            <div className="rec-h"><b>{rec.tagline}</b><span className="mute">{rec.flavor}</span></div>
            <div className="rec-g">
              <div><small>분쇄 (ZP6S)</small><b>{rec.dialText}</b><em>{rec.micronText}</em></div>
              <div><small>물 온도</small><b>{rec.temp[0]}~{rec.temp[1]}°C</b><em>비율 1:{rec.ratio}</em></div>
              <div><small>뜸</small><b>{rec.bloom}초</b><em>원두 ×{rec.bloomMul}</em></div>
              <div><small>총 시간</small><b>{rec.drawdownText}</b><em>{TEMPLATES.find((t) => t.id === rec.tpl)?.label.split(' (')[0]}</em></div>
            </div>
            <div className="mute" style={{ marginTop: 6 }}>교반: {rec.agitation}</div>
            {rec.ageNote && <div className="mute">{rec.ageNote}</div>}
            <details>
              <summary>이렇게 추출해 보세요</summary>
              <div className="dbody">
                <ul className="strat">{rec.strategy.map((t) => <li key={t}>{t}</li>)}</ul>
                <div className="hint warn">{rec.tune[0]}</div>
                <div className="hint warn">{rec.tune[1]}</div>
                <div className="mute">{rec.dripperNote}</div>
                <div className="mute" style={{ marginTop: 6 }}>다이얼 값은 출발점이에요. 그라인더마다 편차가 있으니 첫 추출 후 드로다운 시간으로 보정하고 기록하세요.</div>
              </div>
            </details>
            <button className="btn primary" style={{ width: '100%', marginTop: 8 }} disabled={!dose} onClick={applyRec}>추천 레시피 적용 · {rec.tempMid}°C · {dose ? rec.waterFor(dose) : '-'}g</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>레시피</h2>
        <div className="nums">
          <Num label="원두" unit="g" value={form.dose} step={0.5} onChange={(v) => setNum('dose', v)} />
          <Num label="물" unit="g" value={form.water} step={10} onChange={(v) => setNum('water', v)} />
          <Num label="온도" unit="°C" value={form.temp} step={1} onChange={(v) => set({ temp: v })} />
        </div>
        <div className="ratio">
          <span className="mute">비율</span><b>{dose && water ? `1:${(water / dose).toFixed(1)}` : '-'}</b>
          <span className="chips" style={{ gap: 6 }}>
            {[15, 16, 16.7, 17].map((r) => <button key={r} className="chip" onClick={() => setNum('water', String(Math.round(dose * r)))}>1:{r}</button>)}
          </span>
        </div>
        <div className="sp" />
        <label>붓기 방식</label>
        <div className="chips">
          {TEMPLATES.map((t) => (
            <button key={t.id} className={`chip ${tpl === t.id ? 'on' : ''}`} onClick={() => { setTpl(t.id); set(regen(t.id)); }}>{t.label}</button>
          ))}
        </div>
        <div className="sp" />
        <div><label htmlFor="grind">ZP6S 분쇄 (다이얼/클릭)</label>
          <input id="grind" value={form.grind} onChange={(e) => set({ grind: e.target.value })} placeholder="예: 3.2.0" /></div>

        <div className="sp" />
        <details>
          <summary>붓기 계획 보기·편집 <small>{pts.length}단계</small></summary>
          <div className="dbody">
            <PourChart steps={form.steps} water={water} elapsed={elapsed} />
            <div className="mute" style={{ margin: '2px 0 8px' }}>곡선은 초당 약 5g로 붓는다고 가정</div>
            <div className="step mute"><span>단계</span><span>시작(초)</span><span>누적(g)</span><span /></div>
            {form.steps.map((s, i) => (
              <div key={i} className="step">
                <input value={s.label} onChange={(e) => setStep(i, { label: e.target.value })} aria-label="단계 이름" />
                <input type="number" inputMode="numeric" value={s.t} onChange={(e) => setStep(i, { t: parseFloat(e.target.value) || 0 })} aria-label="시작 초" />
                <input type="number" inputMode="numeric" value={s.g} onChange={(e) => setStep(i, { g: parseFloat(e.target.value) || 0 })} aria-label="누적 g" />
                <button className="btn sm danger" aria-label="삭제" onClick={() => set({ steps: form.steps.filter((_, j) => j !== i), edited: true })}>✕</button>
              </div>
            ))}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn sm" onClick={() => { const l = form.steps.at(-1) ?? { t: 0, g: 0 }; set({ steps: [...form.steps, { label: '추가', t: l.t + 30, g: l.g }], edited: true }); }}>+ 단계 추가</button>
              <button className="btn sm" onClick={() => set(regen())}>템플릿으로 초기화</button>
            </div>
            {hints.map((h) => <div key={h} className="hint warn">{h}</div>)}
          </div>
        </details>
        <details>
          <summary>로스팅일·필터 <small>{form.roastDate || form.filter || ''}</small></summary>
          <div className="dbody grid">
            <div><label>로스팅일</label><input type="date" value={form.roastDate} onChange={(e) => set({ roastDate: e.target.value })} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label>필터 종류</label><input value={form.filter} onChange={(e) => set({ filter: e.target.value })} placeholder="예: 하리오 화이트" /></div>
          </div>
        </details>
        <details>
          <summary>물 붓는 모습 미리보기</summary>
          <div className="dbody"><PourAnimation steps={form.steps} dose={dose} water={water} dripper={form.dripper} live={false} liveElapsed={0} /></div>
        </details>
      </div>

      <div className="cta"><div className="cta-in">
        <button className="btn primary" disabled={!dose || !water} onClick={() => setPhase('brew')}>추출 준비 → <span style={{ fontWeight: 400 }}>{dose}g : {water}g</span></button>
      </div></div>
    </>
  );

  /* ───────── 2. 추출 (타이머·단계·애니메이션을 한 화면에) ───────── */
  const pct = water ? Math.min(100, ((cur?.g ?? 0) / water) * 100) : 0;
  return (
    <>
      <div className="card fit">
        <div className="row between"><span className="mute">{summary}</span><button className="btn sm" onClick={() => setPhase('recipe')}>← 레시피</button></div>
        <div className="tnow">
          <div className="timer">{fmt(elapsed)}</div>
          <div className="now">
            {!started ? <div className="big">시작을 누르세요</div>
              : cur ? <>
                <div className="big">{cur.label} · {cur.g}g</div>
                <div className="sub">{next ? `다음 ${fmt(next.t)} ${next.g}g` : '드로다운 대기'}</div>
              </> : <div className="big">준비</div>}
          </div>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
        <ul className="strip" style={{ gridTemplateColumns: `repeat(${pts.length}, 1fr)` }}>
          {pts.map((p, i) => (
            <li key={i} className={i === idx ? 'cur' : i < idx ? 'past' : ''}>
              <b>{i < idx ? '✓ ' : ''}{p.label}</b><span>{fmt(p.t)} · {p.g}g</span>
            </li>
          ))}
        </ul>
        <div className="anim">
          <PourAnimation steps={form.steps} dose={dose} water={water} dripper={form.dripper} live={started} liveElapsed={elapsed} />
        </div>
      </div>

      <div className="cta"><div className="cta-in">
        {started && <button className="btn ghost" onClick={reset} aria-label="타이머 리셋">↺</button>}
        <button className="btn primary" onClick={toggle}>{running ? '⏸ 일시정지' : started ? '▶ 계속' : '▶ 시작'}</button>
        {started && <button className="btn" onClick={done}>완료 → 시음</button>}
      </div></div>
    </>
  );
}
