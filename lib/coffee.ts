import type { TemplateId } from './brew';

/**
 * 로스팅 단계별 추출 지식. 수치는 핸드드립(V60/웨이브) 기준의 "출발점"이며
 * 여러 로스터·바리스타 가이드(SCA Golden Cup 1:18 범위, 온도 83~96°C 등)의 공통 경향을 정리한 것.
 *
 * 원리: 로스팅이 진해질수록 세포 구조가 부서져 다공성이 높고 밀도가 낮아 → 물이 잘 통하고 쉽게 녹는다.
 * 그래서 진한 로스팅은 ① 더 굵게 ② 더 낮은 온도 ③ 더 약한 교반 ④ 더 짧은 시간,
 * 옅은 로스팅은 그 반대(곱게·뜨겁게·충분한 교반·긴 시간)로 추출을 "끌어올려야" 단맛과 산미가 열린다.
 */
export const ROASTS = ['라이트', '미디엄 라이트', '미디엄', '미디엄 다크', '다크'] as const;
export type Roast = (typeof ROASTS)[number];

export type RoastGuide = {
  roast: Roast;
  tagline: string;
  flavor: string;          // 기대되는 맛
  temp: [number, number];  // °C
  ratio: number;           // 물/원두 (1:x)
  micron: [number, number]; // 평균 입자 크기 목표
  dial: [number, number];  // ZP6 Special 다이얼(소수 표기, 1단위=1번호) 출발 범위
  bloom: number;           // 뜸 시간(초)
  bloomMul: number;        // 뜸 물 = 원두 × n
  tpl: TemplateId;
  drawdown: [number, number]; // 총 추출 시간(초)
  agitation: string;
  strategy: string[];      // 추출 전략
  tune: [string, string];  // [시면, 쓰면]
};

export const ROAST_GUIDE: Record<Roast, RoastGuide> = {
  '라이트': {
    roast: '라이트', tagline: '밀도 높고 단단한 원두 · 산미와 꽃향',
    flavor: '꽃향, 시트러스, 베리, 밝은 산미',
    temp: [94, 96], ratio: 16.7, micron: [600, 750], dial: [5.0, 5.5], bloom: 45, bloomMul: 2.5, tpl: 'v60-3',
    drawdown: [165, 210],
    agitation: '강함 · 뜸 때 충분히 적시고, 메인 붓기는 높게/원을 크게',
    strategy: [
      '밀도가 높아 추출이 어려워요. 가장 뜨거운 물(94~96°C)과 가장 고운 분쇄에서 시작하세요.',
      '뜸은 원두의 2.5배 물, 40~45초. 가스가 많은 신선한 원두는 길게 두면 균일해져요.',
      '메인 붓기에서 교반을 충분히(높이 붓기·스월) 줘야 단맛이 나와요. 시큼하면 더 곱게 or 온도↑.',
      '맛이 날카로우면 4:6 메소드(앞 40%로 산미/단맛 조절)로 균형을 잡아보세요.',
    ],
    tune: ['시고 얇음 → 1~2클릭 곱게, 온도 +1°C, 교반↑', '쓰고 떫음 → 한 클릭 굵게, 낮게 붓기 (라이트는 쉽게 쓰지 않아요)'],
  },
  '미디엄 라이트': {
    roast: '미디엄 라이트', tagline: '산미와 단맛의 균형 · 스페셜티 표준',
    flavor: '과일, 캐러멜 단맛, 부드러운 산미',
    temp: [92, 94], ratio: 16, micron: [650, 800], dial: [5.5, 6.0], bloom: 40, bloomMul: 2, tpl: 'v60-3',
    drawdown: [150, 195],
    agitation: '중간 · 2회 나눠 붓고 중앙 위주로 안정적으로',
    strategy: [
      '대부분의 스페셜티 원두가 여기 해당해요. 92~94°C, 1:16에서 기준을 잡으세요.',
      '뜸 40초 후 2번에 나눠 부으면 가장 안정적이에요 (V60 3단).',
      '드로다운이 2:30~3:15 안에 끝나면 적정. 벗어나면 분쇄로 먼저 맞추세요.',
    ],
    tune: ['시면 → 한 클릭 곱게 or 온도 +1~2°C', '쓰면 → 한 클릭 굵게 or 온도 −1~2°C'],
  },
  '미디엄': {
    roast: '미디엄', tagline: '단맛·바디 중심 · 가장 무난',
    flavor: '견과, 초콜릿, 캐러멜, 둥근 산미',
    temp: [90, 92], ratio: 15.5, micron: [700, 850], dial: [6.0, 6.5], bloom: 35, bloomMul: 2, tpl: 'v60-3',
    drawdown: [140, 180],
    agitation: '중간~약함 · 붓기는 부드럽게, 과한 스월은 피하기',
    strategy: [
      '90~92°C에 1:15.5~16. 쓴맛이 도드라지기 시작하는 구간이라 교반은 중간 이하로.',
      '단맛과 바디를 살리려면 비율을 조금 진하게(1:15) 하는 게 효과적이에요.',
      '뜸 35초, 2회 붓기. 총 2:20~3:00이면 충분해요.',
    ],
    tune: ['시면 → 한 클릭 곱게 (미디엄은 덜 시어요 · 온도 확인)', '쓰면 → 한 클릭 굵게, 온도 −2°C'],
  },
  '미디엄 다크': {
    roast: '미디엄 다크', tagline: '묵직한 바디 · 쓴맛이 올라오기 쉬움',
    flavor: '다크초콜릿, 스모키, 묵직한 바디',
    temp: [87, 90], ratio: 15, micron: [800, 900], dial: [6.5, 7.0], bloom: 30, bloomMul: 2, tpl: 'wave',
    drawdown: [120, 165],
    agitation: '약함 · 낮게, 천천히, 가운데서 부드럽게',
    strategy: [
      '87~90°C로 낮추고 분쇄를 굵게. 같은 레시피를 라이트처럼 뽑으면 바로 쓰고 떫어져요.',
      '낮고 부드럽게 붓기(웨이브 방식). 스월과 높게 붓기는 쓴맛을 키워요.',
      '밍밍하면 온도를 올리기보다 비율을 진하게(1:14~15) 하세요.',
    ],
    tune: ['시고 약하면 → 온도 +1°C보다 비율을 진하게', '쓰면 → 한 클릭 굵게, 온도 −2°C, 교반↓'],
  },
  '다크': {
    roast: '다크', tagline: '쉽게 과추출 · 낮은 온도·짧은 시간',
    flavor: '스모키, 다크초콜릿, 낮은 산미, 강한 바디',
    temp: [83, 88], ratio: 14.5, micron: [850, 1000], dial: [7.0, 7.5], bloom: 30, bloomMul: 2, tpl: 'v60-slow',
    drawdown: [100, 150],
    agitation: '최소 · 한 번에 낮고 천천히 붓고 젓지 않기',
    strategy: [
      '83~88°C의 낮은 온도와 굵은 분쇄가 핵심이에요. 뜨거운 물은 탄 맛·쓴맛만 끌어내요.',
      '연속으로 천천히 붓고 교반을 최소화하세요. 총 추출 시간은 2~2:30 안쪽이 좋아요.',
      '로스팅 직후 3~14일이 적기예요. 오일이 올라오면 그라인더를 자주 청소하세요.',
      '쓰면 온도를 먼저 내리고, 그래도 쓰면 분쇄를 굵게. 비율은 1:14~15로 진하게도 좋아요.',
    ],
    tune: ['시면 → 거의 없음. 분쇄를 곱게 or 온도 +2°C', '쓰면 → 온도 −3°C, 더 굵게, 붓기 줄이기'],
  },
};

export const guideFor = (roast: string): RoastGuide | null => ROAST_GUIDE[roast as Roast] ?? null;

export type Recommendation = RoastGuide & {
  tempMid: number; waterFor: (dose: number) => number;
  dialText: string; micronText: string; drawdownText: string; dripperNote: string; ageNote: string;
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** 로스팅 + 드리퍼 + 로스팅일 → 추천 */
export function recommend(roast: string, dripper: string, roastDate: string): Recommendation | null {
  const g = guideFor(roast);
  if (!g) return null;
  const wave = dripper.includes('웨이브');
  const dShift = wave ? 0.3 : 0;      // 웨이브: 평평한 바닥이라 유속이 제한 → 조금 굵게
  const mShift = wave ? 30 : 0;
  const dial: [number, number] = [g.dial[0] + dShift, g.dial[1] + dShift];
  const micron: [number, number] = [g.micron[0] + mShift, g.micron[1] + mShift];
  const f = (n: number) => n.toFixed(1);

  let ageNote = '';
  if (roastDate) {
    const days = Math.floor((Date.now() - new Date(roastDate).getTime()) / 86400000);
    if (days >= 0) {
      const [lo, hi] = g.roast === '라이트' || g.roast === '미디엄 라이트' ? [7, 28] : g.roast === '미디엄' ? [5, 21] : [3, 14];
      ageNote = days < lo
        ? `로스팅 ${days}일차 · 가스가 많아요. 뜸을 5~10초 더 길게 두세요.`
        : days > hi ? `로스팅 ${days}일차 · 향이 빠지는 시기예요. 한 클릭 곱게 갈아 보완해 보세요.`
        : `로스팅 ${days}일차 · 마시기 좋은 시기예요.`;
    }
  }
  return {
    ...g,
    tempMid: Math.round((g.temp[0] + g.temp[1]) / 2),
    waterFor: (dose) => Math.round(dose * g.ratio),
    dialText: `${f(dial[0])} ~ ${f(dial[1])}`,
    micronText: `${micron[0]}~${micron[1]}µm`,
    drawdownText: `${mmss(g.drawdown[0])} ~ ${mmss(g.drawdown[1])}`,
    dripperNote: wave ? '웨이브는 바닥이 평평하고 구멍이 작아 유속이 제한돼요. V60보다 살짝 굵게(+0.3) 갈고 고르게 붓기.' : 'V60은 붓는 속도와 분쇄로 흐름을 조절해요. 원뿔형이라 중앙으로 물이 모여 교반의 영향이 커요.',
    ageNote,
  };
}
