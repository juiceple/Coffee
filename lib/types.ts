export type Step = { label: string; t: number; g: number };
export const AXES = [
  ['acid', '산미'], ['sweet', '단맛'], ['bitter', '쓴맛'],
  ['body', '바디'], ['aroma', '향'], ['finish', '후미'],
] as const;
export type AxisKey = (typeof AXES)[number][0];
export type Taste = Record<AxisKey, number>;
export const DEFAULT_TASTE: Taste = { acid: 3, sweet: 3, bitter: 3, body: 3, aroma: 3, finish: 3 };
export const TAGS = ['시트러스','베리','과일','꽃향','캐러멜','초콜릿','견과','달콤','깔끔','묵직','밍밍','떫음','탄맛','발효','허브'];

export type Recipe = {
  bean: string; roast: string; roastDate: string; dripper: string; filter: string;
  dose: number; water: number; temp: number; grind: string; steps: Step[];
};
export type Brew = Recipe & {
  id: string; date: string; drawdown: number | null; tds: number | null;
  taste: Taste; overall: number; tags: string[]; memo: string;
};
