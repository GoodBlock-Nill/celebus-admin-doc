'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { mockMembers } from '@/mock/members';
import { formatGP } from '@/lib/utils';
import type { Member } from '@/mock/members';

export default function MembersPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="회원 관리"
        breadcrumbItems={[
          { label: '회원' },
        ]}
      />
      <DataTable<Member & Record<string, unknown>>
        columns={[
          {
            key: 'nickname',
            label: '닉네임',
            render: (item: Member) => (
              <span className="text-blue-600 hover:underline cursor-pointer">{item.nickname}</span>
            ),
          },
          { key: 'email', label: '이메일' },
          {
            key: 'currentGP',
            label: '현재 GP',
            align: 'right',
            width: '150px',
            render: (item: Member) => formatGP(item.currentGP),
          },
        ]}
        data={mockMembers as (Member & Record<string, unknown>)[]}
        onRowClick={(item) => router.push(`/members/${(item as unknown as Member).id}`)}
        emptyMessage="회원이 없습니다."
      />
    </div>
  );
}
