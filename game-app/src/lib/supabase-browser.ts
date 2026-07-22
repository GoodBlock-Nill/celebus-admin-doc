import { createClient } from "@supabase/supabase-js";

// 브라우저 읽기 전용 싱글턴 (anon 키, RLS 적용 — posts_public 뷰만 접근 가능)
// 빌드 시 env가 없어도 createClient가 throw하지 않도록 유효한 플레이스홀더 폴백 사용(런타임엔 실제 env).
export const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
  { auth: { persistSession: false } },
);
