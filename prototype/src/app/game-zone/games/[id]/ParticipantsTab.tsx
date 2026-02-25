'use client';

import { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { formatDateTime, formatGP } from '@/lib/utils';
import type { Game, Participant } from '@/lib/types';

interface ParticipantsTabProps {
  game: Game;
  participants: Participant[];
}

export default function ParticipantsTab({ game, participants }: ParticipantsTabProps) {
  const [page, setPage] = useState(1);
  const isST = game.type === 'SURVIVAL_TRIVIA';

  if (game.status === 'Draft' || game.status === 'Ready') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-500">게임이 아직 게시되지 않아 참여 내역이 없습니다.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(participants.length / ITEMS_PER_PAGE);
  const paginated = participants.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const pmColumns = [
    { key: 'nickname', label: '닉네임', render: (item: Participant) => <span className="text-blue-600 hover:underline cursor-pointer">{item.nickname.toLowerCase()}</span> },
    { key: 'participatedAt', label: '참여일시', sortable: true, render: (item: Participant) => formatDateTime(item.participatedAt) },
    { key: 'choice', label: '선택', align: 'center' as const, width: '100px' },
    { key: 'participationGP', label: '참여 GP', align: 'right' as const, width: '120px', sortable: true, render: (item: Participant) => formatGP(item.participationGP) },
    { key: 'boostingGP', label: '부스팅 GP', align: 'right' as const, width: '120px', sortable: true, render: (item: Participant) => formatGP(item.boostingGP) },
    { key: 'status', label: '상태', align: 'center' as const, width: '120px', render: (item: Participant) => <Badge variant="custom" value={item.status} customBg="bg-green-100" customText="text-green-600" customLabel={item.status} /> },
  ];

  const stColumns = [
    { key: 'nickname', label: '닉네임', render: (item: Participant) => <span className="text-blue-600 hover:underline cursor-pointer">{item.nickname.toLowerCase()}</span> },
    { key: 'participatedAt', label: '참여일시', sortable: true, render: (item: Participant) => formatDateTime(item.participatedAt) },
    { key: 'survivedStage', label: '생존 스테이지', align: 'center' as const, width: '130px', render: (item: Participant) => (
      <span className={item.survivedStage === 10 ? 'text-green-600 font-medium' : 'text-gray-900'}>
        {item.survivedStage ?? '-'}/10
      </span>
    )},
    { key: 'heartsUsed', label: '하트 사용', align: 'center' as const, width: '100px', render: (item: Participant) => `${item.heartsUsed ?? 0}개` },
    { key: 'participationGP', label: '참여 GP', align: 'right' as const, width: '120px', render: (item: Participant) => formatGP(item.participationGP) },
    { key: 'result', label: '결과', align: 'center' as const, width: '100px', render: (item: Participant) => (
      <Badge variant="custom"
        value={item.eliminatedAtStage === null ? 'survived' : 'eliminated'}
        customBg={item.eliminatedAtStage === null ? 'bg-green-100' : 'bg-red-100'}
        customText={item.eliminatedAtStage === null ? 'text-green-600' : 'text-red-600'}
        customLabel={item.eliminatedAtStage === null ? '생존' : '탈락'}
      />
    )},
  ];

  return (
    <>
      <DataTable<Participant & Record<string, unknown>>
        columns={isST ? stColumns : pmColumns}
        data={paginated as (Participant & Record<string, unknown>)[]}
        emptyMessage="참여 내역이 없습니다."
        rowNumber={{ page, perPage: ITEMS_PER_PAGE }}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}
