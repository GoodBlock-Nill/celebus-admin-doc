'use client';

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import {
  getBenefitById,
  getBenefitBives,
  type BiveBenefit,
  type BenefitStatus,
  type BenefitBive,
} from '@/mock/bive';
import AddBiveModal from './AddBiveModal';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'bive', label: 'BIVE 추가' },
] as const;

const STATUS_BADGE: Record<BenefitStatus, string> = {
  '초안': 'bg-amber-100 text-amber-700',
  '대기': 'bg-blue-100 text-blue-700',
  '활성': 'bg-emerald-100 text-emerald-700',
  '중지': 'bg-red-100 text-red-700',
  '종료': 'bg-gray-200 text-gray-700',
};

const CYCLE_LABEL: Record<string, string> = { DAILY: '일일', WEEKLY: '주간', ONCE: '1회(획득 시)' };

// 5상태별 헤더 액션 매트릭스 ([CEB-BO-BIVE-204] §4 정합)
function headerActionsFor(status: BenefitStatus): { label: string; tone: 'primary' | 'danger' | 'neutral'; action: string }[] {
  switch (status) {
    case '초안':
      return [
        { label: '삭제', tone: 'danger', action: '혜택 삭제' },
        { label: '활성대기', tone: 'primary', action: '초안 → 대기 (시작일시 도달 시 자동 활성)' },
      ];
    case '대기':
      return [{ label: '대기 취소', tone: 'neutral', action: '대기 → 초안' }];
    case '활성':
      return [{ label: '일시중지', tone: 'neutral', action: '활성 → 중지' }];
    case '중지':
      return [{ label: '활성 재개', tone: 'primary', action: '중지 → 활성' }];
    case '종료':
      return [];
  }
}

export default function BenefitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const benefitId = parseInt(id, 10);
  const benefit = getBenefitById(benefitId);
  const initialBives = getBenefitBives(benefitId);
  const router = useRouter();
  const search = useSearchParams();
  const tab = (search.get('tab') as 'info' | 'bive') || 'info';
  const [addOpen, setAddOpen] = useState(false);
  const [bives, setBives] = useState<BenefitBive[]>(initialBives);

  if (!benefit) {
    return <div className="p-8 text-sm text-gray-500">혜택을 찾을 수 없습니다.</div>;
  }

  const setTab = (k: string) => router.push(`/bive/benefits/${benefitId}?tab=${k}`);
  const actions = headerActionsFor(benefit.status);
  const typeLabel = benefit.type === 'BP' ? 'Boost point' : 'Raffle Ticket';

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={`${typeLabel} 혜택 상세`}
          breadcrumbItems={[
            { label: 'BIVE' },
            { label: '혜택 관리', href: '/bive/benefits' },
            { label: benefit.name },
          ]}
        />
        <div className="flex items-center gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => alert(`[Mock] ${a.action}`)}
              title={a.action}
              className={
                a.tone === 'danger'
                  ? 'h-10 px-4 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50'
                  : a.tone === 'primary'
                  ? 'h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700'
                  : 'h-10 px-4 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50'
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'info' && <InfoTab benefit={benefit} />}
      {tab === 'bive' && (
        <BiveTab
          benefit={benefit}
          bives={bives}
          editable={benefit.status === '초안' || benefit.status === '중지'}
          onAdd={() => setAddOpen(true)}
          onRemove={(id) => setBives((p) => p.filter((b) => b.biveId !== id))}
        />
      )}

      <AddBiveModal
        isOpen={addOpen}
        existingBiveIds={bives.map((b) => b.biveId)}
        onClose={() => setAddOpen(false)}
        onAdd={(selected) => {
          setBives((p) => [
            ...p,
            ...selected.map((t) => ({
              biveId: t.id,
              editionId: t.editionId,
              biveName: t.name,
              artistGroup: t.artistGroup,
              artist: t.artist,
              grade: t.grade,
              gradeNumber: t.gradeNumber,
            })),
          ]);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

function InfoTab({ benefit }: { benefit: BiveBenefit }) {
  // 5상태별 수정 가능 필드 분기 ([204] §4 정합)
  // 초안: 전체 수정 / 대기·활성: 잠금 / 중지: 종료일·종료시간만 수정 / 종료: 읽기 전용
  const allowAll = benefit.status === '초안';
  const allowEndOnly = benefit.status === '중지';
  const lockField = (field: 'end') => !(allowAll || (allowEndOnly && field === 'end'));

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-5">
        <div className={`px-4 py-3 rounded-lg text-sm ${allowAll ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
          {allowAll && '지급 로직을 식별할 수 있는 명칭과 검증액션을 선택하세요'}
          {benefit.status === '대기' && '활성대기 상태에서는 정보 수정이 불가합니다. 대기 취소 후 수정해주세요.'}
          {benefit.status === '활성' && '활성 상태에서는 정보 수정이 불가합니다. 일시중지 후 종료일만 수정 가능합니다.'}
          {benefit.status === '중지' && '중지 상태에서는 종료일·종료시간만 수정 가능합니다.'}
          {benefit.status === '종료' && '종료된 혜택은 읽기 전용입니다.'}
        </div>
        <Field label="혜택 명칭">
          <input defaultValue={benefit.name} disabled={!allowAll} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" />
        </Field>
        <Field label={benefit.type === 'BP' ? 'BP 수량' : '응모권 수량'}>
          <input type="number" defaultValue={benefit.amount} disabled={!allowAll} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" />
        </Field>
        <Field label="지급주기">
          <div className="relative">
            <select defaultValue={benefit.cycle} disabled={!allowAll} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50">
              <option value="DAILY">일일</option>
              <option value="WEEKLY">주간</option>
              <option value="ONCE">1회(획득 시)</option>
            </select>
            <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </Field>
        {benefit.cycle === 'WEEKLY' && (
          <Field label="지급요일 (주간)">
            <div className="relative">
              <select defaultValue={benefit.weekday ?? ''} disabled={!allowAll} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50">
                {['월', '화', '수', '목', '금', '토', '일'].map((d) => <option key={d} value={d}>{d}요일</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작일">
            <input defaultValue={benefit.startDate} disabled={!allowAll} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" />
          </Field>
          <Field label="시작시간">
            <input defaultValue={benefit.startTime} disabled={!allowAll} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" />
          </Field>
          <Field label="종료일">
            <input defaultValue={benefit.endDate} disabled={lockField('end')} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" />
          </Field>
          <Field label="종료시간">
            <input defaultValue={benefit.endTime} disabled={lockField('end')} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" />
          </Field>
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl p-5 h-fit space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">관리 정보</h4>
        <Stat label="상태"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[benefit.status]}`}>{benefit.status}</span></Stat>
        <Stat label="유형">{benefit.type === 'BP' ? 'Boost Point' : 'Raffle Ticket'}</Stat>
        <Stat label="지급주기">{CYCLE_LABEL[benefit.cycle]}</Stat>
        <Stat label="등록 BIVE">{benefit.registeredBive}건</Stat>
        <Stat label="생성일시">{benefit.createdAt}</Stat>
      </div>
    </div>
  );
}

function BiveTab({
  benefit,
  bives,
  editable,
  onAdd,
  onRemove,
}: {
  benefit: BiveBenefit;
  bives: BenefitBive[];
  editable: boolean;
  onAdd: () => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        {benefit.type === 'BP' ? '본 혜택의 Boost Point' : '본 혜택의 응모권'}을 받게 될 BIVE를 추가해주세요.
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">등록된 BIVE: <span className="text-gray-900 font-semibold">{bives.length}</span>건</div>
        {editable && (
          <button
            onClick={onAdd}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
          >
            <PlusIcon className="w-4 h-4" />추가하기
          </button>
        )}
      </div>
      <SimpleTable<BenefitBive>
        columns={[
          { key: 'biveName', label: 'BIVE 명칭', render: (r) => <span className="text-gray-900">{r.biveName}</span> },
          { key: 'artistGroup', label: '아티스트 그룹', width: '130px' },
          { key: 'artist', label: '아티스트', width: '100px' },
          { key: 'grade', label: '등급', width: '80px' },
          { key: 'gradeNumber', label: '등급번호', width: '90px' },
          { key: 'manage', label: '관리', width: '70px', render: (r) => (
            editable
              ? <button onClick={() => onRemove(r.biveId)} className="text-red-500 text-xs hover:underline">삭제</button>
              : <span className="text-gray-300 text-xs">-</span>
          )},
        ]}
        rows={bives}
        emptyMessage="추가하기 버튼을 눌러 BIVE를 등록하세요."
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{children}</span>
    </div>
  );
}
