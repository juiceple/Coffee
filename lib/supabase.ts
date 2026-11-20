import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
/** NEXT_PUBLIC_SUPABASE_* 가 설정돼 있을 때만 클라이언트를 만든다. */
export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 환경변수가 설정되지 않았어요 (.env.example 참고)');
  return (client ??= createClient(url, key));
}
