'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon, CalendarIcon, ClockIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';

// [CEB-BO-BIVE-204-CREATE] 혜택 생성 (운영 BO 풀페이지 정합)
// 라우트: /bive/benefits/create?type=boostPoint|ticket

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'bive', label: 'BIVE 추가' },
] as const;

function CreateBenefitContent() {
  const router = useRouter();
  const search = useSearchParams();
  const type = (search.get('type') === 'ticket' ? 'TICKET' : 'BP') as 'BP' | 'TICKET';
  const title = type === 'BP' ? 'Boost point 혜택 생성' : 'Raffle Ticket 혜택 생성';

  const [tab, setTab] = useState<'info' | 'bive'>('info');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('DAILY');
  const [weekday, setWeekday] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');

  const canSubmit = name.trim() && amount && cycle && startDate && endDate && (cycle !== 'WEEKLY' || weekday);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={title}
          breadcrumbItems={[
            { label: 'BIVE' },
            { label: '혜택 관리', href: '/bive/benefits' },
            { label: '혜택 생성' },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/bive/benefits')}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소하기
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              alert(`[Mock] ${title}\n${name}`);
              router.push('/bive/benefits');
            }}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            생성하기
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-indigo-50 px-4 py-3 rounded-lg text-sm">
              <div className="font-semibold text-indigo-700">캠페인 기본 정보</div>
              <div className="text-indigo-700">지급 로직을 식별할 수 있는 명칭과 검증액션을 선택하세요.</div>
            </div>
            <Field label="혜택 명칭">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="명칭을 입력해주세요"
                className="w-full h-12 px-3 border border-gray-200 rounded-lg text-sm"
              />
            </Field>
            <Field label={type === 'BP' ? 'BP 수량' : '응모권 수량'}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="지급 수량을 입력해주세요"
                className="w-full h-12 px-3 border border-gray-200 rounded-lg text-sm"
              />
            </Field>
            <Field label="지급주기">
              <div className="relative">
                <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white">
                  <option value="DAILY">일일</option>
                  <option value="WEEKLY">주간</option>
                  <option value="ONCE">1회(획득 시)</option>
                </select>
                <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </Field>
            <Field label="지급요일 (주간)">
              <div className="relative">
                <select value={weekday} onChange={(e) => setWeekday(e.target.value)} disabled={cycle !== 'WEEKLY'} className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50">
                  <option value="">지급요일을 선택해주세요</option>
                  {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
                    <option key={d}>{d}요일</option>
                  ))}
                </select>
                <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="시작일">
                <div className="relative">
                  <input value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="YYYY.MM.DD" className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm" />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="시작시간">
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-12 pl-9 pr-9 border border-gray-200 rounded-lg text-sm" />
                  <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </Field>
              <Field label="종료일">
                <div className="relative">
                  <input value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="YYYY.MM.DD" className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm" />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="종료시간">
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-12 pl-9 pr-9 border border-gray-200 rounded-lg text-sm" />
                  <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </Field>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
            {type === 'BP' ? '본 혜택의 Boost Point' : '본 혜택의 응모권'}을 받게 될 BIVE를 추가해주세요.
          </div>
          <div className="flex items-center justify-end mb-3">
            <button
              disabled
              className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" />추가하기
            </button>
          </div>
          <SimpleTable
            columns={[
              { key: 'name', label: 'BIVE 명칭', wrap: true },
              { key: 'group', label: '아티스트 그룹', width: '130px' },
              { key: 'artist', label: '아티스트', width: '100px' },
              { key: 'grade', label: '등급', width: '80px' },
              { key: 'gradeNumber', label: '등급번호', width: '90px' },
              { key: 'manage', label: '관리', width: '70px' },
            ]}
            rows={[]}
            emptyMessage="혜택 생성 후 BIVE를 추가할 수 있습니다."
          />
        </div>
      )}
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

export default function CreateBenefitPage() {
  return (
    <Suspense fallback={null}>
      <CreateBenefitContent />
    </Suspense>
  );
}
