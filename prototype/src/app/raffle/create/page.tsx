'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import RaffleForm, { EMPTY_RAFFLE_FORM, canSubmitRaffle, type RaffleFormValues } from '../_components/RaffleForm';

export default function RaffleCreatePage() {
  const router = useRouter();
  const [values, setValues] = useState<RaffleFormValues>(EMPTY_RAFFLE_FORM);

  const valid = canSubmitRaffle(values);

  const handleCancel = () => {
    const dirty = JSON.stringify(values) !== JSON.stringify(EMPTY_RAFFLE_FORM);
    if (dirty && !window.confirm('작성 중인 내용이 사라집니다. 취소하시겠어요?')) return;
    router.push('/raffle');
  };

  const handleSubmit = () => {
    if (!valid) return;
    alert(`[Mock] 래플 생성 — '${values.titleKO}' (임시저장)`);
    router.push('/raffle');
  };

  return (
    <div>
      {/* [CEB-BO-012] §1 정합 — 사용자 가시 영역 "Raffle" 영문 혼용 금지 (2026-05-21 sync 정정) */}
      <PageHeader title="래플 생성" breadcrumbItems={[{ label: '래플', href: '/raffle' }, { label: '래플 생성' }]} />

      <div className="flex items-center justify-end gap-2 mb-5">
        <button onClick={handleCancel} className="h-10 px-5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
          취소하기
        </button>
        <button
          onClick={handleSubmit}
          disabled={!valid}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed"
        >
          생성하기
        </button>
      </div>

      <RaffleForm values={values} onChange={setValues} />
    </div>
  );
}
