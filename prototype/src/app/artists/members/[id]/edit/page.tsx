'use client';

import { use } from 'react';
import MemberForm from '../../MemberForm';
import { getMemberById } from '@/mock/artists';

export default function MemberEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const member = getMemberById(parseInt(id, 10));
  if (!member) {
    return <div className="text-center py-20 text-gray-500">멤버를 찾을 수 없습니다.</div>;
  }
  return <MemberForm mode="edit" member={member} />;
}
