'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { BiveOwned } from '@/mock/members';

interface Props {
  bive: BiveOwned | null;
  onClose: () => void;
}

export default function BiveDetailModal({ bive, onClose }: Props) {
  const [tab, setTab] = useState<'detail' | 'history'>('detail');

  useEffect(() => {
    if (bive) {
      setTab('detail');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [bive]);

  if (!bive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Dimmed bg */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Right slide-in panel */}
      <div className="relative w-full max-w-[920px] bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">
            {bive.biveName} <span className="text-gray-500 font-normal">{bive.tokenIdShort}</span>
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center" aria-label="닫기">
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-0">
            {[
              { k: 'detail', label: '토큰 상세' },
              { k: 'history', label: '토큰 히스토리' },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as 'detail' | 'history')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {tab === 'detail' ? (
            <div className="grid grid-cols-3 gap-6">
              {/* Left 2/3 */}
              <div className="col-span-2 space-y-4">
                {/* 기본정보 */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">기본정보</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="에디션" value={bive.editionFull} />
                    <Field label="아티스트 그룹" value={bive.artistGroupFull} />
                    <Field label="아티스트" value={bive.artistFull} />
                    <Field label="등급" value={bive.grade} />
                    <Field label="등급번호" value={bive.gradeNumber} />
                    <Field label="민팅일시" value={bive.mintedAt} />
                  </div>
                </div>

                {/* 기능상태 */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">기능상태</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <CapabilityField label="보내기" enabled={bive.canSend} />
                    <CapabilityField label="Mix" enabled={bive.canMix} />
                    <CapabilityField label="PICK" enabled={bive.canPick} />
                  </div>
                </div>
              </div>

              {/* Right 1/3 */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">민팅정보</h4>
                  <div className="space-y-4">
                    <Field label="Token ID" value={bive.tokenIdFull} />
                    <Field label="민팅일시" value={bive.mintedAt} />
                    <FieldLink label="민팅이벤트" value={bive.mintEvent} />
                    <FieldLink label="홀더" value={bive.holderNickname} />
                    <FieldLink label="홀더지갑" value={bive.holderWalletShort} mono />
                  </div>
                </div>

                {/* BIVE 이미지 */}
                <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-purple-900 aspect-[3/4] rounded-xl overflow-hidden flex items-end justify-center p-6">
                  <div className="text-white text-center">
                    <div className="text-2xl font-bold tracking-wider">CELEBUS</div>
                    <div className="text-sm mt-1 opacity-80">Your kosmos in progress</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 border-dashed rounded-xl p-16 text-center">
              <p className="text-sm text-gray-500">토큰 히스토리는 추후 제공됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function FieldLink({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
        <span className={mono ? 'font-mono' : ''}>{value}</span>
        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CapabilityField({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {enabled ? '가능' : '불가능'}
      </span>
    </div>
  );
}
