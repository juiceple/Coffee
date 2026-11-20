'use client';
import { useState } from 'react';
import { AXES, DEFAULT_TASTE, TAGS, type Brew, type Taste } from '@/lib/types';
import { tuneHints, fmt, type Hint } from '@/lib/brew';
import type { Form } from './BrewTab';

export const Hints = ({ list }: { list: Hint[] }) => <>{list.map(([c, t]) => <div key={t} className={`hint ${c}`}>{t}</div>)}</>;

type Props = {
  form: Form; drawdown: string; setDrawdown: (v: string) => void;
  onSave: (b: Brew) => Promise<void>; onSaved: () => void; onBack: () => void;
};
const ENDS: Record<string, [string, string]> = {
  acid: ['약함', '강함'], sweet: ['약함', '강함'], bitter: ['약함', '강함'],
  body: ['가벼움', '묵직'], aroma: ['약함', '풍부'], finish: ['짧음', '긴 여운'],
};

export default function TasteTab({ form, drawdown, setDrawdown, onSave, onSaved, onBack }: Props) {
  const [taste, setTaste] = useState<Taste>(DEFAULT_TASTE);
  const [overall, setOverall] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [tds, setTds] = useState('');
  const [msg, setMsg] = useState<Hint[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const dose = parseFloat(form.dose) || 0, water = parseFloat(form.water) || 0;
  const dd = parseFloat(drawdown) || null;

  const save = async () => {
    const brew: Brew = {
      id: Date.now().toString(36), date: new Date().toISOString(),
      bean: form.bean.trim(), roast: form.roast, roastDate: form.roastDate, dripper: form.dripper, filter: form.filter.trim(),
      dose, water, temp: parseFloat(form.temp) || 0, grind: form.grind.trim(), steps: form.steps,
      drawdown: dd, tds: parseFloat(tds) || null, taste, overall, tags, memo: memo.trim(),
    };
    setBusy(true);
    try { await onSave(brew); setErr(''); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : '저장 실패'); }
    finally { setBusy(false); }
  };
  const live: Hint[] = tuneHints({ dose, water }, taste, dd);

  return (
    <>
      <div className="card">
        <div className="row between"><h2 style={{ margin: 0 }}>{form.bean || '이름 없는 원두'}</h2><button className="btn sm" onClick={onBack}>← 추출</button></div>
        <div className="recap" style={{ marginTop: 10 }}>
          <div>레시피<b>{dose}g : {water}g</b></div>
          <div>비율<b>1:{dose ? (water / dose).toFixed(1) : '-'}</b></div>
          <div>온도<b>{form.temp}°C</b></div>
          <div>분쇄<b>{form.grind || '-'}</b></div>
          {dd ? <div>드로다운<b>{fmt(dd)}</b></div> : null}
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          <div><label>드로다운 총 시간 (초)</label><input type="number" inputMode="numeric" value={drawdown} onChange={(e) => setDrawdown(e.target.value)} placeholder="예: 175" /></div>
          <div><label>TDS % (선택)</label><input type="number" inputMode="decimal" step="0.01" value={tds} onChange={(e) => setTds(e.target.value)} placeholder="예: 1.35" /></div>
        </div>
      </div>

      <div className="card">
        <h2>전체 만족도</h2>
        <div className="stars" role="radiogroup" aria-label="전체 만족도">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} role="radio" aria-checked={overall === i} aria-label={`${i}점`} onClick={() => setOverall(i === overall ? 0 : i)}>{i <= overall ? '★' : '☆'}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>어떤 맛이었어?</h2>
        {AXES.map(([k, l]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <div className="sl">
              <label style={{ margin: 0 }} htmlFor={`ax-${k}`}>{l}</label>
              <input id={`ax-${k}`} type="range" min={1} max={5} step={1} value={taste[k]} onChange={(e) => setTaste({ ...taste, [k]: +e.target.value })} />
              <b>{taste[k]}</b>
            </div>
            <div className="sl"><span /><div className="ends" style={{ gridColumn: 2 }}><span>{ENDS[k][0]}</span><span>{ENDS[k][1]}</span></div></div>
          </div>
        ))}
        <Hints list={live} />
        <label style={{ marginTop: 8 }}>맛 태그</label>
        <div className="chips">{TAGS.map((t) => (
          <button key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>
        ))}</div>
        <div className="sp" />
        <label htmlFor="memo">메모 (향, 느낀 점, 다음에 바꿀 것)</label>
        <textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 식으면서 단맛이 올라옴. 다음엔 한 클릭 더 곱게." />
        {err && <div className="hint warn">{err}</div>}
      </div>

      <div className="cta"><div className="cta-in">
        <button className="btn primary" onClick={save} disabled={busy}>{busy ? '저장 중…' : '기록 저장'}</button>
      </div></div>
    </>
  );
}
