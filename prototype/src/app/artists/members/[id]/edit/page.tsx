'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MemberForm from '../../MemberForm';
import { toast } from '@/components/ui/Toast';
import { getMemberById } from '@/mock/artists';

export default function MemberEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const member = getMemberById(parseInt(id, 10));

  useEffect(() => {
    if (!member) {
      toast.error('존재하지 않는 멤버입니다.');
      router.replace('/artists/members');
    }
  }, [member, router]);

  if (!member) return null;
  return <MemberForm mode="edit" member={member} />;
}
