'use client';

import { use } from 'react';
import GroupForm from '../../GroupForm';
import { getGroupById } from '@/mock/artists';

export default function GroupEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const group = getGroupById(parseInt(id, 10));
  if (!group) {
    return <div className="text-center py-20 text-gray-500">그룹을 찾을 수 없습니다.</div>;
  }
  return <GroupForm mode="edit" group={group} />;
}
