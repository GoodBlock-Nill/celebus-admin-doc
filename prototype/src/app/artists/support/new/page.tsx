'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { toast } from '@/components/ui/Toast';
import SupportForm from '../[id]/_components/SupportForm';

export default function NewSupportPage() {
  const router = useRouter();

  const handleSubmit = (action: 'save_draft' | 'create') => {
    toast.success(
      action === 'save_draft'
        ? '임시저장되었습니다 (이벤트명 외 항목은 추후 보강 가능)'
        : '서포트 이벤트가 생성되었습니다 (게시 전 임시저장 상태)',
    );
    setTimeout(() => router.push('/artists/support'), 600);
  };

  return (
    <div>
      <PageHeader
        title="서포트 이벤트 생성"
        breadcrumbItems={[
          { label: '아티스트' },
          { label: '서포트 관리', href: '/artists/support' },
          { label: '이벤트 생성' },
        ]}
      />
      <div className="mt-6">
        <SupportForm
          mode="create"
          onSubmitCreate={handleSubmit}
          onCancelCreate={() => router.push('/artists/support')}
        />
      </div>
    </div>
  );
}
