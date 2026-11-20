'use client';
import { useMemo, useState } from 'react';
import Radar from './Radar';
import { Hints } from './TasteTab';
import { fmt, tuneHints } from '@/lib/brew';
import type { Brew } from '@/lib/types';

type Props = {
  brews: Brew[]; onNew: () => void; onReuse: (b: Brew) => void; onDelete: (id: string) => Promise<void>;
  onImport: (bs: Brew[]) => Promise<number>;
};
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function HistoryTab({ brews, onNew, onReuse, onDelete, onImport }: Props) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'date' | 'score'>('date');
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return brews
      .filter((b) => !k || `${b.bean} ${b.memo} ${b.tags.join(' ')}`.toLowerCase().includes(k))
      .sort((a, b) => (sort === 'score' ? b.overall - a.overall : 0) || b.date.localeCompare(a.date));
  }, [brews, q, sort]);

  const exportJson = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(brews, null, 1)], { type: 'application/json' }));
    a.download = `brewlog-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  const importJson = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data)) throw 0;
      alert(`${await onImport(data)}개 가져왔어요`);
    } catch { alert('올바른 백업 파일이 아니에요'); }
  };

  return (
    <>
      {brews.length > 0 && (
        <div className="row" style={{ marginBottom: 12 }}>
          <input style={{ flex: '1 1 160px' }} placeholder="원두·메모·태그 검색" aria-label="검색" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="seg" style={{ flex: '0 0 auto' }}>
            <button className={sort === 'date' ? 'on' : ''} onClick={() => setSort('date')}>최신</button>
            <button className={sort === 'score' ? 'on' : ''} onClick={() => setSort('score')}>별점</button>
          </div>
        </div>
      )}

      {!brews.length && <div className="empty card"><b>☕</b>아직 기록이 없어요.<br />첫 추출을 하고 맛을 남겨보세요.<div className="sp" /><button className="btn primary" onClick={onNew}>첫 추출 시작</button></div>}
      {!!brews.length && !list.length && <div className="empty">검색 결과가 없어요.</div>}
      {list.map((b) => (
        <div key={b.id} className="card item" onClick={() => setOpen(open === b.id ? null : b.id)}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{b.bean || '이름 없는 원두'}</h3><span className="rating" aria-label={`${b.overall}점`}>{stars(b.overall)}</span>
          </div>
          <div className="mute">
            {new Date(b.date).toLocaleDateString('ko-KR')} · {b.dripper} · {b.dose}g:{b.water}g · {b.temp}°C · 분쇄 {b.grind || '-'}{b.drawdown ? ` · ${fmt(b.drawdown)}` : ''}
          </div>
          <div style={{ marginTop: 6 }}>{b.tags.map((t) => <span key={t} className="chip" style={{ cursor: 'default', minHeight: 28, padding: '2px 10px', fontSize: 13 }}>{t}</span>)}</div>
          {open === b.id && (
            <div onClick={(e) => e.stopPropagation()}>
              <div className="row" style={{ alignItems: 'flex-start', marginTop: 8 }}>
                <Radar taste={b.taste} />
                <div className="mute" style={{ flex: 1, minWidth: 180 }}>
                  {b.roast}{b.roastDate ? ` · 로스팅 ${b.roastDate}` : ''}<br />
                  필터 {b.filter || '-'}{b.tds ? <><br />TDS {b.tds}%</> : null}<br />
                  <b>붓기</b> {b.steps.map((s) => `${fmt(s.t)} ${s.label} ${s.g}g`).join(' → ')}
                </div>
              </div>
              {b.memo && <p>{b.memo}</p>}
              <Hints list={tuneHints(b, b.taste, b.drawdown)} />
              <div className="row">
                <button className="btn sm primary" onClick={() => onReuse(b)}>이 레시피로 다시</button>
                <button className="btn sm danger" onClick={() => confirm('이 기록을 삭제할까요?') && onDelete(b.id)}>삭제</button>
              </div>
            </div>
          )}
        </div>
      ))}

      <details className="card flat" style={{ marginTop: 16 }}>
        <summary>데이터 백업</summary><div className="dbody">
        <p className="mute">지금은 이 기기 브라우저(localStorage)에만 저장돼요. 가끔 백업하세요.</p>
        <div className="row">
          <button className="btn" onClick={exportJson}>백업 내보내기</button>
          <label className="btn" style={{ margin: 0 }}>가져오기
            <input type="file" accept="application/json" hidden onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
      </div></details>
    </>
  );
}
