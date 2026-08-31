import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * service_role 접근 클라이언트 — 서버(라우트 핸들러) 전용.
 * 예매 도메인 테이블은 전부 deny-all RLS라 이 키 또는 SECURITY DEFINER RPC로만 접근한다.
 * `server-only` import 가드로 클라이언트 번들 유입을 빌드 단계에서 차단한다.
 */
export function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase 환경변수가 없습니다 (URL / SERVICE_ROLE_KEY).');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
