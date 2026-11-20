'use client';
import { useState } from 'react';
import { AXES, DEFAULT_TASTE, TAGS, type Brew, type Taste } from '@/lib/types';
import { tuneHints, type Hint } from '@/lib/brew';
import type { Form } from './BrewTab';

export const Hints = ({ list }: { list: Hint[] }) => <>{list.map(([c, t]) => <div key={t} className={`hint ${c}`}>{t}</div>)}</>;

type Props = { form: Form; drawdown: string; setDrawdown: (v: string) => void; onSave: (b: Brew) => Promise<void> };

export default function TasteTab({ form, drawdown, setDrawdown, onSave }: Props) {
  const [taste, setTaste] = useState<Taste>(DEFAULT_TASTE);
  const [overall, setOverall] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [tds, setTds] = useState('');
  const [msg, setMsg] = useState<Hint[] | null>(null);
  const [err, setErr] = useState('');

  const dose = parseFloat(form.dose) || 0, water = parseFloat(form.water) || 0;
  const reset = () => { setTaste(DEFAULT_TASTE); setOverall(0); setTags([]); setMemo(''); setTds(''); setDrawdown(''); };

  const save = async () => {
    const dd = parseFloat(drawdown) || null;
    const brew: Brew = {
      id: Date.now().toString(36), date: new Date().toISOString(),
      bean: form.bean.trim(), roast: form.roast, roastDate: form.roastDate, dripper: form.dripper, filter: form.filter.trim(),
      dose, water, temp: parseFloat(form.temp) || 0, grind: form.grind.trim(), steps: form.steps,
      drawdown: dd, tds: parseFloat(tds) || null, taste, overall, tags, memo: memo.trim(),
    };
    try {
      await onSave(brew); setErr('');
      setMsg([['good', '저장됨 ✓ 히스토리에서 확인하세요.'], ...tuneHints(brew, taste, dd)]);
      reset();
    } catch (e) { setErr(e instanceof Error ? e.message : '저장 실패'); }
  };

  return (
    <>
      <div className="card">
        <h2>이번 추출 요약</h2>
        <div className="mute">
          <b>{form.bean || '이름 없는 원두'}</b> · {form.roast}<br />
          {form.dripper} · {dose}g : {water}g (1:{dose ? (water / dose).toFixed(1) : '-'}) · {form.temp}°C · 분쇄 {form.grind || '-'}
        </div>
        <div className="grid" style={{ marginTop: 10 }}>
          <div><label>드로다운 총 시간 (초)</label><input type="number" inputMode="numeric" value={drawdown} onChange={(e) => setDrawdown(e.target.value)} placeholder="예: 175" /></div>
          <div><label>TDS % (선택)</label><input type="number" inputMode="decimal" step="0.01" value={tds} onChange={(e) => setTds(e.target.value)} placeholder="예: 1.35" /></div>
        </div>
      </div>

      <div className="card">
        <h2>어떤 맛이었어?</h2>
        {AXES.map(([k, l]) => (
          <div className="sl" key={k}>
            <label style={{ margin: 0 }}>{l}</label>
            <input type="range" min={1} max={5} step={1} value={taste[k]} aria-label={l} onChange={(e) => setTaste({ ...taste, [k]: +e.target.value })} />
            <b>{taste[k]}</b>
          </div>
        ))}
        <label style={{ marginTop: 12 }}>전체 만족도</label>
        <div className="row">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} className="btn sm" style={{ fontSize: 20, color: 'var(--accent)' }} aria-label={`${i}점`} onClick={() => setOverall(i)}>{i <= overall ? '★' : '☆'}</button>
          ))}
        </div>
        <label style={{ marginTop: 12 }}>맛 태그</label>
        <div>{TAGS.map((t) => (
          <span key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</span>
        ))}</div>
        <label>메모 (향, 느낀 점, 다음에 바꿀 것)</label>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 식으면서 단맛이 올라옴. 다음엔 한 클릭 더 곱게." />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={save}>저장</button>
          <button className="btn" onClick={() => { reset(); setMsg(null); }}>초기화</button>
        </div>
        {err && <div className="hint warn">{err}</div>}
        {msg && <Hints list={msg} />}
      </div>
    </>
  );
}
