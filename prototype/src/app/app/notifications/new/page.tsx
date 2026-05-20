'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import NotificationForm, { emptyFormState } from '@/components/app/NotificationForm';

export default function NotificationNewPage() {
  const router = useRouter();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');

  const back = () => router.push('/app/notifications');

  const handleSchedule = () => {
    if (!scheduleAt.trim()) {
      alert('예약 일시를 입력해 주세요.');
      return;
    }
    alert(`예약 발송이 등록되었습니다. (예약 일시: ${scheduleAt}) (Mock)`);
    setScheduleOpen(false);
    back();
  };

  return (
    <div>
      <PageHeader
        title="새 알림"
        breadcrumbItems={[
          { label: '앱' },
          { label: '알림 관리', href: '/app/notifications' },
          { label: '새 알림' },
        ]}
        actions={
          <>
            <button
              onClick={back}
              className="h-10 px-4 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={() => {
                alert('임시저장되었습니다. (Mock)');
                back();
              }}
              className="h-10 px-4 border border-gray-300 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              임시저장
            </button>
            <button
              onClick={() => setScheduleOpen(true)}
              className="h-10 px-4 border border-amber-400 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100"
            >
              예약 발송
            </button>
            <button
              onClick={() => {
                alert('발송 큐에 등록되었습니다. (Mock)');
                back();
              }}
              className="h-10 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              발송
            </button>
          </>
        }
      />

      <NotificationForm initial={emptyFormState()} />

      {scheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setScheduleOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <header className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">예약 발송 일시</h2>
              <p className="text-xs text-gray-500 mt-1">
                도래 시 자동으로 발송 큐에 진입합니다 (KST, 분 단위)
              </p>
            </header>
            <div className="p-5">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">예약 일시</label>
              <input
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                placeholder="2026.05.21 09:00"
                autoFocus
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <footer className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setScheduleOpen(false)}
                className="h-9 px-4 text-sm border border-gray-200 bg-white text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSchedule}
                className="h-9 px-4 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600"
              >
                예약 확정
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
