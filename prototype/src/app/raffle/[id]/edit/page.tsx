'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import RaffleForm, { canSubmitRaffle, raffleToForm, type RaffleFormValues } from '../../_components/RaffleForm';
import { getRaffleById, RAFFLE_STATUS_BADGE } from '@/mock/fanquest';

export default function RaffleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const raffleId = parseInt(id, 10);
  const raffle = getRaffleById(raffleId);
  const router = useRouter();

  const [values, setValues] = useState<RaffleFormValues | null>(raffle ? raffleToForm(raffle) : null);

  if (!raffle || !values) return <div className="p-8 text-sm text-gray-500">래플을 찾을 수 없습니다.</div>;

  const isClosed = raffle.status === '종료' || raffle.status === '추첨대기';
  const isActive = raffle.status === '진행중';
  const valid = canSubmitRaffle(values);

  const handleCancel = () => {
    if (!window.confirm('수정 중인 내용이 사라집니다. 취소하시겠어요?')) return;
    router.push(`/raffle/${raffleId}`);
  };

  const handleSubmit = () => {
    if (!valid || isClosed) return;
    alert(`[Mock] Raffle 수정 저장 — '${values.titleKO}'`);
    router.push(`/raffle/${raffleId}`);
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '래플', href: '/raffle' },
          { label: 'Raffle 상세', href: `/raffle/${raffleId}` },
          { label: '수정' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-5">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-bold text-gray-900">Raffle 수정</h1>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm text-gray-700 max-w-[460px] truncate">{raffle.titleKO}</span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${RAFFLE_STATUS_BADGE[raffle.status]}`}>
                {raffle.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCancel} className="h-10 px-5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
            취소하기
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || isClosed}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed"
          >
            저장하기
          </button>
        </div>
      </div>

      {isActive && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>진행중 상태</strong>에서는 응모자 보호를 위해 <strong>아티스트 · 마감일시 · 당첨 추첨 수 · 보상지급 타입</strong> 변경이 차단됩니다.
            이미지·타이틀·설명·경품 상세·수령 가이드·유의사항만 수정 가능합니다.
          </p>
        </div>
      )}

      {isClosed && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-5 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-800 leading-relaxed">
            <strong>{raffle.status}</strong> 상태의 래플은 수정할 수 없습니다. 본 페이지는 읽기 전용입니다.
          </p>
        </div>
      )}

      <RaffleForm values={values} onChange={setValues} activeLocks={isActive} closedReadonly={isClosed} />
    </div>
  );
}
