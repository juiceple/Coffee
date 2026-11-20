'use client';
import { useEffect, useRef, useState } from 'react';
import PourChart from './PourChart';
import { TEMPLATES, fmt, templateSteps, type TemplateId } from '@/lib/brew';
import type { Step } from '@/lib/types';

export type Form = {
  bean: string; roast: string; roastDate: string; dripper: string; filter: string;
  dose: string; water: string; temp: string; grind: string; steps: Step[]; edited: boolean;
};
type Props = { form: Form; setForm: (f: Form) => void; onDone: (seconds: number) => void };

export default function BrewTab({ form, setForm, onDone }: Props) {
  const [tpl, setTpl] = useState<TemplateId>('v60-3');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const base = useRef(0), t0 = useRef(0), raf = useRef(0), wake = useRef<WakeLockSentinel | null>(null);

  const dose = parseFloat(form.dose) || 0, water = parseFloat(form.water) || 0;
  const set = (p: Partial<Form>) => setForm({ ...form, ...p });
  const regen = (id = tpl, d = dose, w = water) => ({ steps: templateSteps(id, d, w), edited: false });
  const setNum = (k: 'dose' | 'water', v: string) => {
    const d = k === 'dose' ? parseFloat(v) || 0 : dose, w = k === 'water' ? parseFloat(v) || 0 : water;
    set({ [k]: v, ...(form.edited ? {} : regen(tpl, d, w)) } as Partial<Form>);
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

  return (
    <>
      <div className="card">
        <h2>1. 무엇을 내릴까?</h2>
        <div className="grid">
          <div><label>원두 / 로스터</label><input value={form.bean} onChange={(e) => set({ bean: e.target.value })} placeholder="예: 에티오피아 구지 · 로스터" /></div>
          <div><label>로스팅 / 로스팅일</label>
            <div className="row">
              <select value={form.roast} onChange={(e) => set({ roast: e.target.value })} style={{ flex: '1 1 100px' }}>
                {['라이트', '미디엄 라이트', '미디엄', '다크'].map((r) => <option key={r}>{r}</option>)}
              </select>
              <input type="date" value={form.roastDate} onChange={(e) => set({ roastDate: e.target.value })} style={{ flex: '1 1 130px' }} />
            </div>
          </div>
          <div><label>드리퍼</label>
            <select value={form.dripper} onChange={(e) => set({ dripper: e.target.value })}>
              {['V60', '칼리타 웨이브', '기타'].map((r) => <option key={r}>{r}</option>)}
            </select></div>
          <div><label>필터 종류</label><input value={form.filter} onChange={(e) => set({ filter: e.target.value })} placeholder="예: 하리오 화이트" /></div>
        </div>
      </div>

      <div className="card">
        <h2>2. 레시피</h2>
        <div className="grid grid3">
          <div><label>원두 (g)</label><input type="number" inputMode="decimal" step="0.1" value={form.dose} onChange={(e) => setNum('dose', e.target.value)} /></div>
          <div><label>물 (g)</label><input type="number" inputMode="decimal" value={form.water} onChange={(e) => setNum('water', e.target.value)} /></div>
          <div><label>물 온도 (°C)</label><input type="number" inputMode="numeric" value={form.temp} onChange={(e) => set({ temp: e.target.value })} /></div>
        </div>
        <div className="row" style={{ margin: '8px 0' }}>
          <span className="mute">비율</span><b>{dose && water ? `1:${(water / dose).toFixed(1)}` : '-'}</b>
          <span className="mute">빠른 선택</span>
          {[15, 16, 16.7, 17].map((r) => <span key={r} className="chip" onClick={() => setNum('water', String(Math.round(dose * r)))}>1:{r}</span>)}
        </div>
        <div className="grid">
          <div><label>ZP6S 분쇄 (다이얼/클릭)</label><input value={form.grind} onChange={(e) => set({ grind: e.target.value })} placeholder="예: 3.2.0" /></div>
          <div><label>붓기 템플릿</label>
            <select value={tpl} onChange={(e) => { const id = e.target.value as TemplateId; setTpl(id); set(regen(id)); }}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select></div>
        </div>
        <p className="mute" style={{ margin: '8px 0 0' }}>분쇄는 본인 ZP6S 다이얼 표기 그대로 적으세요. 맛 기록에 따라 어느 쪽으로 돌릴지 힌트를 줍니다.</p>
      </div>

      <div className="card">
        <h2>3. 붓기 계획 <span className="mute">(누적 물량 기준)</span></h2>
        <PourChart steps={form.steps} water={water} elapsed={elapsed} />
        <div className="mute" style={{ margin: '2px 0 8px' }}>■ 곡선은 초당 약 5g로 붓는다고 가정</div>
        <div className="step mute"><span>단계</span><span>시작(초)</span><span>누적(g)</span><span /></div>
        {form.steps.map((s, i) => (
          <div key={i} className={`step ${cur === s ? 'cur' : ''}`}>
            <input value={s.label} onChange={(e) => setStep(i, { label: e.target.value })} aria-label="단계 이름" />
            <input type="number" inputMode="numeric" value={s.t} onChange={(e) => setStep(i, { t: parseFloat(e.target.value) || 0 })} aria-label="시작 초" />
            <input type="number" inputMode="numeric" value={s.g} onChange={(e) => setStep(i, { g: parseFloat(e.target.value) || 0 })} aria-label="누적 g" />
            <button className="btn sm danger" aria-label="삭제" onClick={() => set({ steps: form.steps.filter((_, j) => j !== i), edited: true })}>✕</button>
          </div>
        ))}
        <div className="row" style={{ marginTop: 6 }}>
          <button className="btn sm" onClick={() => { const l = form.steps.at(-1) ?? { t: 0, g: 0 }; set({ steps: [...form.steps, { label: '추가', t: l.t + 30, g: l.g }], edited: true }); }}>+ 단계 추가</button>
          <button className="btn sm" onClick={() => set(regen())}>템플릿으로 초기화</button>
        </div>
        {hints.map((h) => <div key={h} className="hint warn">{h}</div>)}
      </div>

      <div className="card">
        <h2>4. 추출 타이머</h2>
        <div className="timer">{fmt(elapsed)}</div>
        <div className="target">
          {!running && elapsed === 0 ? '시작을 누르세요'
            : next ? <>{cur?.label ?? '준비'} → <b>{cur?.g ?? 0}g</b> 까지 · 다음 {fmt(next.t)} <b>{next.g}g</b></>
            : cur ? <>마지막 단계 <b>{cur.g}g</b> · 드로다운 대기</> : null}
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="btn primary" onClick={toggle}>{running ? '⏸ 일시정지' : elapsed > 0 ? '▶ 계속' : '▶ 시작'}</button>
          <button className="btn" onClick={reset}>리셋</button>
          <button className="btn" onClick={done}>완료 → 시음 기록</button>
        </div>
        <p className="mute" style={{ textAlign: 'center', margin: '8px 0 0' }}>물줄기가 끊기지 않을 정도(초당 약 5g)로, 메인 붓기 중에는 젓지 않기.</p>
      </div>
    </>
  );
}
