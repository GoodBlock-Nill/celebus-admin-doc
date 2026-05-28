'use client';

import { use } from 'react';
import FeedDetail from '../FeedDetail';
import { getFeedById } from '@/mock/feed';

export default function FeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = getFeedById(parseInt(id, 10));

  if (!item) {
    return <div className="text-center py-20 text-gray-500">콘텐츠를 찾을 수 없습니다.</div>;
  }

  return <FeedDetail item={item} />;
}
