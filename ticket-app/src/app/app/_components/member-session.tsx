'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { PageSkeleton } from './feedback';
import { SsoGate, type GateReason } from './sso-gate';
import { api } from '@/lib/api-client';
import type { MeView } from '@/lib/api-types';
import { ssoLogin } from '@/lib/auth-api';

const UNAUTHORIZED = 401;

interface MemberSessionValue {
  me: MeView;
  /** 본인확인 완료 등으로 회원 상태가 바뀐 뒤 다시 읽어온다. */
  refreshMe: () => Promise<void>;
}

const MemberSessionContext = createContext<MemberSessionValue | null>(null);

/** 로그인 회원 정보 — 회원 영역 화면 어디서나 사용 */
export function useMemberSession(): MemberSessionValue {
  const value = useContext(MemberSessionContext);
  if (!value) throw new Error('회원 세션 정보를 사용할 수 없는 위치입니다.');
  return value;
}

type SessionState = 'LOADING' | 'GATE' | 'READY';

/**
 * 회원 영역 진입 게이트.
 * 저장된 세션이 없으면 CELEBUS 계정 연계를 시도하고, 그래도 실패하면 로그인 안내 화면을 띄운다.
 */
export function MemberSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>('LOADING');
  const [me, setMe] = useState<MeView | null>(null);
  const [gateReason, setGateReason] = useState<GateReason>('NO_SESSION');
  const [isRetrying, setRetrying] = useState(false);

  const refreshMe = useCallback(async () => {
    const result = await api.me();
    if (result.ok) setMe(result.data.me);
  }, []);

  const establishSession = useCallback(async () => {
    const current = await api.me();
    if (current.ok) {
      setMe(current.data.me);
      setState('READY');
      return;
    }

    if (current.status !== UNAUTHORIZED) {
      setGateReason('OFFLINE');
      setState('GATE');
      return;
    }

    const profile = await ssoLogin();
    if (!profile.signedUp) {
      setGateReason(profile.bridge ? 'BRIDGE_FAIL' : profile.offline ? 'OFFLINE' : 'NO_SESSION');
      setState('GATE');
      return;
    }

    const issued = await api.me();
    if (!issued.ok) {
      setGateReason('BRIDGE_FAIL');
      setState('GATE');
      return;
    }

    setMe(issued.data.me);
    setState('READY');
  }, []);

  useEffect(() => {
    void establishSession();
  }, [establishSession]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setState('LOADING');
    await establishSession();
    setRetrying(false);
  }, [establishSession]);

  const value = useMemo(() => (me ? { me, refreshMe } : null), [me, refreshMe]);

  if (state === 'GATE') {
    return <SsoGate reason={gateReason} busy={isRetrying} onRetry={() => void handleRetry()} />;
  }

  if (state === 'LOADING' || !value) return <PageSkeleton rows={3} />;

  return <MemberSessionContext.Provider value={value}>{children}</MemberSessionContext.Provider>;
}
