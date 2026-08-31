import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { AdminLogin } from './_components/admin-login';
import { AdminShell } from './_components/shell';
import { ADMIN_COOKIE, verifyAdminCookie } from '@/lib/server/admin-auth';

/** 관리자 화면은 매 요청마다 세션을 다시 확인한다(캐시 금지). */
export const dynamic = 'force-dynamic';

/**
 * /admin/** 공용 가드 (설계서 §3.3).
 * 서명 쿠키 검증에 실패하면 하위 화면을 렌더하지 않고 로그인 화면만 보여준다.
 * 관리자 API도 각 라우트에서 동일한 쿠키를 다시 검증한다(이중 방어).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const adminName = verifyAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value);

  if (!adminName) return <AdminLogin />;

  return <AdminShell adminName={adminName}>{children}</AdminShell>;
}
