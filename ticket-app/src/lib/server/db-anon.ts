import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * anon 키 클라이언트 — 익명 읽기가 허용된 공개 뷰(공연·회차 잔여)만 접근 가능하다.
 * 도메인 테이블은 deny-all RLS + 권한 회수 상태라 이 키로는 열람되지 않는다.
 * 빌드 시 환경변수가 없어도 createClient가 실패하지 않도록 플레이스홀더를 둔다(런타임엔 실제 값).
 */
export function anon(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    { auth: { persistSession: false } },
  );
}
