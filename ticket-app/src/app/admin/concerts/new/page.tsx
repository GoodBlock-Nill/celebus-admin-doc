'use client';

import Link from 'next/link';

import { PageHeader } from '../../_components/ui';
import { ConcertCreateForm } from '../_components/concert-create-form';

/** 공연 등록 화면 */
export default function AdminConcertCreatePage() {
  return (
    <>
      <PageHeader
        title="공연 등록"
        description="공연 정보와 회차별 배정 수량을 입력해 새 공연을 만듭니다. 등록 직후에는 판매 예정 상태입니다."
        actions={
          <Link
            href="/admin/concerts"
            className="rounded-lg border border-[#C9CDD6] bg-white px-3 py-2 text-[13px] font-semibold text-[#1B1D22] hover:bg-[#F2F3F6]"
          >
            공연 목록
          </Link>
        }
      />
      <ConcertCreateForm />
    </>
  );
}
