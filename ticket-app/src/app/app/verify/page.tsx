'use client';

import { Suspense } from 'react';

import { AppHeader } from '../_components/app-header';
import { PageSkeleton } from '../_components/feedback';
import { VerifyFlow } from './verify-flow';

/** A3 본인확인 — 모의 간편인증 (PASS·카카오·토스·네이버) */
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
