'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon, CalendarIcon, ClockIcon } from '@heroicons/react/20/solid';

export default function CreateBenefitModal({ isOpen, onClose, type = 'BP' }: { isOpen: boolean; onClose: () => void; type?: 'BP' | 'TICKET' }) {
  const [tab, setTab] = useState<'info' | 'bive'>('info');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('');
  const [weekday, setWeekday] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');

  if (!isOpen) return null;

  const title = type === 'BP' ? 'Boost point 혜택 생성' : 'Raffle Ticket 혜택 생성';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              취소하기
            </button>
            <button
              disabled={!name.trim() || !amount || !cycle || !startDate || !endDate}
              onClick={() => {
                alert(`[Mock] ${title}\n${name}`);
                onClose();
              }}
              className="h-9 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              생성하기
            </button>
            <button onClick={onClose} className="ml-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <XMarkIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6">
          <div className="flex gap-0">
            {([['info', '기본정보'], ['bive', 'BIVE 추가']] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
          {tab === 'info' ? (
            <>
              <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm">
                <div className="font-semibold">캠페인 기본 정보</div>
                <div>지급 로직을 식별할 수 있는 명칭과 검증액션을 선택하세요.</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">혜택 명칭</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="명칭을 입력해주세요"
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">{type === 'BP' ? 'BP 수량' : '응모권 수량'}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="지급 수량을 입력해주세요"
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">지급주기</label>
                <div className="relative">
                  <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white">
                    <option value="">지급주기를 선택해주세요</option>
                    <option value="DAILY">일일</option>
                    <option value="WEEKLY">주간</option>
                  </select>
                  <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">지급요일 (주간)</label>
                <div className="relative">
                  <select value={weekday} onChange={(e) => setWeekday(e.target.value)} disabled={cycle !== 'WEEKLY'} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50">
                    <option value="">지급요일을 선택해주세요</option>
                    {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
                      <option key={d}>{d}요일</option>
                    ))}
                  </select>
                  <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">시작일</label>
                  <div className="relative">
                    <input
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="YYYY.MM.DD"
                      className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">시작시간</label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-11 pl-9 pr-9 border border-gray-200 rounded-lg text-sm"
                    />
                    <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">종료일</label>
                  <div className="relative">
                    <input
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="YYYY.MM.DD"
                      className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">종료시간</label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full h-11 pl-9 pr-9 border border-gray-200 rounded-lg text-sm"
                    />
                    <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-gray-500">
              혜택 생성 후 BIVE를 추가할 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
