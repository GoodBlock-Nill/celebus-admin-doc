import { createClient } from "@supabase/supabase-js";

// anon 키 — 읽기 전용(RLS 적용). posts_public 뷰만 접근 가능. 브라우저/서버 모두 사용 가능.
export function anon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 없습니다 (URL / ANON_KEY).");
  return createClient(url, key, { auth: { persistSession: false } });
}
