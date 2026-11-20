import type { Brew } from './types';
import { getSupabase } from './supabase';

/** 저장소 인터페이스. 지금은 localStorage만 쓰고, Supabase 구현은 준비만 해둠. */
export interface BrewRepo {
  list(): Promise<Brew[]>;
  add(b: Brew): Promise<void>;
  remove(id: string): Promise<void>;
  addMany(bs: Brew[]): Promise<void>;
}

const KEY = 'brewlog.v1';
const read = (): Brew[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
};
const write = (v: Brew[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

const localRepo: BrewRepo = {
  async list() { return read(); },
  async add(b) { write([...read(), b]); },
  async remove(id) { write(read().filter((x) => x.id !== id)); },
  async addMany(bs) { write([...read(), ...bs]); },
};

// supabase/migrations/0001_brews.sql 의 brews 테이블 사용 (data 컬럼에 Brew JSON)
const supabaseRepo: BrewRepo = {
  async list() {
    const { data, error } = await getSupabase().from('brews').select('data').order('created_at');
    if (error) throw error;
    return (data ?? []).map((r) => r.data as Brew);
  },
  async add(b) {
    const { error } = await getSupabase().from('brews').insert({ id: b.id, data: b });
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await getSupabase().from('brews').delete().eq('id', id);
    if (error) throw error;
  },
  async addMany(bs) {
    const { error } = await getSupabase().from('brews').upsert(bs.map((b) => ({ id: b.id, data: b })));
    if (error) throw error;
  },
};

// 기본은 local. NEXT_PUBLIC_STORAGE=supabase 일 때만 DB 사용.
export const repo: BrewRepo = process.env.NEXT_PUBLIC_STORAGE === 'supabase' ? supabaseRepo : localRepo;

export const DRAFT_KEY = 'brewlog.draft.v1';
export const draft = {
  load<T>(): T | null { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null'); } catch { return null; } },
  save(v: unknown) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch {} },
};
