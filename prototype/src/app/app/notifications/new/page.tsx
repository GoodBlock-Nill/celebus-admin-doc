'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import NotificationForm, { emptyFormState } from '@/components/app/NotificationForm';

export default function NotificationNewPage() {
  const router = useRouter();
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
              onClick={() => router.push('/app/notifications')}
              className="h-10 px-4 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={() => alert('임시저장되었습니다. (Mock)')}
              className="h-10 px-4 border border-gray-300 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              임시저장
            </button>
            <button
              onClick={() => alert('예약이 등록되었습니다. (Mock)')}
              className="h-10 px-4 border border-amber-400 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100"
            >
              예약 발송
            </button>
            <button
              onClick={() => alert('발송 큐에 등록되었습니다. (Mock)')}
              className="h-10 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              발송
            </button>
          </>
        }
      />

      <NotificationForm initial={emptyFormState()} />
    </div>
  );
}
