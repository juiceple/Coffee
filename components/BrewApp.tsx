'use client';
import { useEffect, useState } from 'react';
import BrewTab, { type Form } from './BrewTab';
import TasteTab from './TasteTab';
import HistoryTab from './HistoryTab';
import GuideTab from './GuideTab';
import { templateSteps } from '@/lib/brew';
import { draft, repo } from '@/lib/repo';
import type { Brew } from '@/lib/types';

const TABS = [['brew', '💧', '추출'], ['taste', '👅', '시음 기록'], ['hist', '📒', '히스토리'], ['guide', '📖', '가이드']] as const;
type Tab = (typeof TABS)[number][0];

const INITIAL: Form = {
  bean: '', roast: '라이트', roastDate: '', dripper: 'V60', filter: '', dose: '15', water: '240', temp: '92', grind: '',
  steps: templateSteps('v60-3', 15, 240), edited: false,
};

export default function BrewApp() {
  const [tab, setTab] = useState<Tab>('brew');
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
  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  const refresh = () => repo.list().then(setBrews);

  return (
    <>
      <header>
        <h1>☕ My Brew Log</h1><small>Grinder · 1Zpresso ZP6 Special</small>
      </header>
      <main>
        {/* 탭을 전환해도 타이머/입력 상태가 유지되도록 모두 마운트해 둔다 */}
        <section className="view" hidden={tab !== 'brew'}>
          <BrewTab form={form} setForm={setForm} onDone={(s) => { if (s > 0) setDrawdown(String(s)); setTab('taste'); }} />
        </section>
        <section className="view" hidden={tab !== 'taste'}>
          <TasteTab form={form} drawdown={drawdown} setDrawdown={setDrawdown} onSave={async (b) => { await repo.add(b); await refresh(); }} />
        </section>
        <section className="view" hidden={tab !== 'hist'}>
          <HistoryTab
            brews={brews}
            onReuse={(b) => { setForm({ ...b, dose: String(b.dose), water: String(b.water), temp: String(b.temp), steps: b.steps.map((s) => ({ ...s })), edited: true }); setTab('brew'); }}
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
      <nav>
        {TABS.map(([k, icon, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><span>{icon}</span><small>{label}</small></button>
        ))}
      </nav>
    </>
  );
}
