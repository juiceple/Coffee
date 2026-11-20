import type { Recipe, Step, Taste } from './types';

export type TemplateId = 'v60-3' | 'v60-slow' | 'wave' | '46';
export const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'v60-3', label: 'V60 3단 (뜸+2회)' },
  { id: 'v60-slow', label: 'V60 연속 붓기' },
  { id: 'wave', label: '웨이브 (낮게, 고르게)' },
  { id: '46', label: '4:6 메소드' },
];

export function templateSteps(id: TemplateId, dose: number, water: number): Step[] {
  const r = Math.round;
  const bloom = r(dose * 2); // 뜸 물은 원두의 약 2배
  switch (id) {
    case 'v60-3': return [{ label: '뜸', t: 0, g: bloom }, { label: '1차', t: 40, g: r(water * 0.55) }, { label: '2차', t: 80, g: r(water) }];
    case 'v60-slow': return [{ label: '뜸', t: 0, g: bloom }, { label: '연속 붓기', t: 40, g: r(water) }];
    case 'wave': return [{ label: '뜸', t: 0, g: bloom }, { label: '1차 (낮게)', t: 40, g: r(water * 0.6) }, { label: '2차', t: 85, g: r(water) }];
    case '46': return [0.2, 0.4, 0.6, 0.8, 1].map((f, i) => ({ label: `${i + 1}차`, t: i * 45, g: r(water * f) }));
  }
}

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export type Hint = ['good' | 'warn', string];
export function tuneHints(r: Pick<Recipe, 'dose' | 'water'>, t: Taste, drawdown: number | null): Hint[] {
  const out: Hint[] = [];
  const { acid: a, sweet: s, bitter: b, body } = t;
  if (a >= 4 && b >= 4) out.push(['warn', '신맛과 쓴맛이 동시에 강해요. 입자 분포가 넓거나 채널링일 수 있어요. 붓기를 부드럽게 하고 필터를 충분히 린싱해 보세요.']);
  else if (a >= 4 && s <= 2) out.push(['warn', '덜 추출된 느낌이에요. ZP6S를 한두 클릭 곱게 하거나 온도를 1~2°C 올리고 교반을 조금 늘려보세요.']);
  else if (b >= 4 && s <= 2) out.push(['warn', '과다 추출 느낌이에요. 한두 클릭 굵게 하거나 온도를 낮추고 교반을 줄여보세요.']);
  if (body <= 2 && a <= 3 && b <= 3) {
    const ratio = r.dose ? r.water / r.dose : 16;
    out.push(['warn', `밍밍하다면 비율을 진하게(예: 1:${Math.max(14, ratio - 1).toFixed(0)}) 해 보세요.`]);
  }
  if (drawdown) {
    if (drawdown < 120) out.push(['warn', `드로다운 ${drawdown}초는 빠른 편이에요. 더 곱게 갈거나 낮게 붓기를 시도하세요.`]);
    if (drawdown > 240) out.push(['warn', `드로다운 ${drawdown}초는 느린 편이에요. 더 굵게 갈거나 필터 막힘을 확인하세요.`]);
  }
  if (!out.length && a >= 2 && a <= 4 && s >= 3 && b <= 3) out.push(['good', '균형이 좋아요. 이 레시피를 기준으로 한 가지씩만 바꿔 비교해 보세요.']);
  return out;
}
