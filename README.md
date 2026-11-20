# My Brew Log

커피 추출 레시피 계획 + 시음 기록 (Next.js App Router + TypeScript, Supabase 연동 준비).

```bash
npm install
npm run dev     # http://localhost:3000
```

## 저장소
기본값은 **localStorage**(DB 저장 안 함). 저장 로직은 `lib/repo.ts`의 `BrewRepo` 인터페이스 뒤에 있고,
Supabase 구현도 들어 있지만 꺼져 있습니다.

DB 저장을 켜려면:
1. `supabase/migrations/0001_brews.sql` 적용 (RLS: 본인 행만 접근 → 로그인 필요)
2. `.env.local`에 `NEXT_PUBLIC_STORAGE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
3. Supabase Auth 로그인 UI 추가 (아직 없음)
