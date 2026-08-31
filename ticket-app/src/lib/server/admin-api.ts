import 'server-only';

// 관리자 API 공통 가드·호출 유틸.
// 모든 /api/admin/** 라우트는 여기서 서명 쿠키를 검증하고, 상태 변경은 service_role RPC로만 수행한다.
import { NextResponse } from 'next/server';

import { readAdminName } from './admin-auth';
import { HTTP_STATUS, fail, ok, type RpcResult } from './api';
import { admin } from './db-admin';

/** 관리자 세션 확인 — 통과하면 처리자 이름, 실패하면 즉시 반환할 응답 */
export function requireAdmin(req: Request): string | NextResponse {
  const adminName = readAdminName(req);
  if (!adminName) return fail('관리자 로그인이 필요합니다.', HTTP_STATUS.unauthorized);
  return adminName;
}

/** requireAdmin 결과가 응답(실패)인지 구분 */
export function isGuardFailure(value: string | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

/** 조회 화면 진입 시 마감 경과 주문 정리 (설계서 §5 lazy 만료) */
export async function expireOverdueOrders(): Promise<void> {
  await admin().rpc('ticket_expire_overdue_orders');
}

/**
 * 상태 전이 RPC 호출 → 공통 응답 변환.
 * RPC는 { ok, reason } 규약을 지키므로 실패 사유를 화면 문구로 그대로 전달한다.
 */
export async function callAdminRpc(
  name: string,
  params: Record<string, unknown>,
  failureFallback: string,
): Promise<NextResponse> {
  const { data, error } = await admin().rpc(name, params);
  const result = data as RpcResult | null;

  if (error || !result) return fail(failureFallback, HTTP_STATUS.serverError);
  if (!result.ok) return fail(String(result.reason ?? failureFallback), HTTP_STATUS.badRequest);

  const { ok: _ignored, ...rest } = result;
  return ok(rest);
}
