'use client';
import { useEffect, useState } from 'react';
import BrewTab, { type Form } from './BrewTab';
import TasteTab from './TasteTab';
import HistoryTab from './HistoryTab';
import GuideTab from './GuideTab';
import { templateSteps } from '@/lib/brew';
import { draft, repo } from '@/lib/repo';
import type { Brew } from '@/lib/types';

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const TABS = [
  ['brew', '추출', 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2'],
  ['hist', '기록', 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3'],
  ['guide', '가이드', 'M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3zM10 21h4'],
] as const;
type Tab = (typeof TABS)[number][0];
export type Phase = 'recipe' | 'brew' | 'taste';
const PHASES: [Phase, string][] = [['recipe', '레시피'], ['brew', '추출'], ['taste', '시음']];

const INITIAL: Form = {
  bean: '', roast: '라이트', roastDate: '', dripper: 'V60', filter: '', dose: '15', water: '240', temp: '92', grind: '',
  steps: templateSteps('v60-3', 15, 240), edited: false,
};

export default function BrewApp() {
  const [tab, setTab] = useState<Tab>('brew');
  const [phase, setPhase] = useState<Phase>('recipe');
  const [session, setSession] = useState(0); // 저장 후 타이머/시음 입력 초기화용
  const [form, setForm] = useState<Form>(INITIAL);
  const [ready, setReady] = useState(false);
  const [drawdown, setDrawdown] = useState('');
  const [brews, setBrews] = useState<Brew[]>([]);

  useEffect(() => {
    const d = draft.load<Form>();
    if (d?.steps) setForm({ ...INITIAL, ...d });
    repo.list().then(setBrews).catch(() => {});
    setReady(true);
  }, []);
  useEffect(() => { if (ready) draft.save(form); }, [form, ready]);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, phase]);

  const refresh = () => repo.list().then(setBrews);
  const order = PHASES.map(([k]) => k);

  return (
    <>
      <div className="top">
        <div className="top-in">
          <h1>☕ My Brew Log</h1><small>ZP6 Special · 기록 {brews.length}개</small>
        </div>
        {tab === 'brew' && (
          <div className="flow" role="tablist" aria-label="추출 단계">
            {PHASES.map(([k, l], i) => (
              <button key={k} role="tab" aria-selected={phase === k} className={`${phase === k ? 'on' : ''} ${order.indexOf(phase) > i ? 'done' : ''}`} onClick={() => setPhase(k)}>
                <i>{order.indexOf(phase) > i ? '✓' : i + 1}</i>{l}
              </button>
            ))}
          </div>
        )}
      </div>
      <main>
        {/* 탭을 전환해도 타이머/입력 상태가 유지되도록 모두 마운트해 둔다 */}
        <section className="view" hidden={tab !== 'brew' || phase === 'taste'}>
          <BrewTab key={session} form={form} setForm={setForm} phase={phase} setPhase={setPhase}
            onDone={(s) => { if (s > 0) setDrawdown(String(s)); setPhase('taste'); }} />
        </section>
        <section className="view" hidden={tab !== 'brew' || phase !== 'taste'}>
          <TasteTab key={session} form={form} drawdown={drawdown} setDrawdown={setDrawdown}
            onBack={() => setPhase('brew')}
            onSave={async (b) => { await repo.add(b); await refresh(); }}
            onSaved={() => { setDrawdown(''); setSession((n) => n + 1); setPhase('recipe'); setTab('hist'); }} />
        </section>
        <section className="view" hidden={tab !== 'hist'}>
          <HistoryTab
            brews={brews}
            onNew={() => { setTab('brew'); setPhase('recipe'); }}
            onReuse={(b) => { setForm({ ...b, dose: String(b.dose), water: String(b.water), temp: String(b.temp), steps: b.steps.map((s) => ({ ...s })), edited: true }); setSession((n) => n + 1); setPhase('recipe'); setTab('brew'); }}
            onDelete={async (id) => { await repo.remove(id); await refresh(); }}
            onImport={async (inc) => {
              const have = new Set(brews.map((b) => b.id));
              const add = inc.filter((x) => x?.id && !have.has(x.id));
              await repo.addMany(add); await refresh(); return add.length;
            }}
          />
        </section>
        <section className="view" hidden={tab !== 'guide'}><GuideTab /></section>
      </main>
      <nav className="tabs">
        {TABS.map(([k, label, d]) => (
          <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k} onClick={() => setTab(k)}><Icon d={d} />{label}</button>
        ))}
      </nav>
    </>
  );
}
