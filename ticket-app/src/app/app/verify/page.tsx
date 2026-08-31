'use client';

import { Suspense } from 'react';

import { AppHeader } from '../_components/app-header';
import { PageSkeleton } from '../_components/feedback';
import { VerifyFlow } from './verify-flow';

/** A3 본인확인 — 모의 휴대폰 인증 */
export default function VerifyPage() {
  return (
    <main>
      <AppHeader title="본인확인" backHref="/app" />
      <Suspense fallback={<PageSkeleton rows={3} />}>
        <VerifyFlow />
      </Suspense>
    </main>
  );
}
