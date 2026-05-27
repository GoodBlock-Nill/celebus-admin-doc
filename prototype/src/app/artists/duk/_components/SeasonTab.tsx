'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { toast } from '@/components/ui/Toast';
import SeasonFormModal from './SeasonFormModal';
import { dukSeasons as initialSeasons, type DukSeason, type DukSeasonStatus } from '@/mock/duk';

// [CEB-BO-ART-401] v1.6 §2-1 탭 1 — 랭킹 시즌 설정
// - 시즌 리스트 + [신규 시즌] 버튼만 보유
// - 액션 컬럼 폐기 (v1.6) — row 클릭만으로 상세 진입 (백오피스 전체 통일 패턴 정합)
// - [수정]·[종료] 액션은 시즌 상세 페이지 상단으로 이동

const STATUS_BADGE: Record<DukSeasonStatus, string> = {
  예정: 'bg-gray-100 text-gray-700',
  진행중: 'bg-emerald-100 text-emerald-700',
  종료: 'bg-gray-900 text-white',
};

const PAGE_SIZE = 20;

export default function SeasonTab() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<DukSeason[]>(initialSeasons);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () => [...seasons].sort((a, b) => (a.startAt < b.startAt ? 1 : -1)),
    [seasons],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const slice = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = (data: {
    artistGroupId: number;
    name: string;
    startAt: string;
    endAt: string;
  }) => {
    const groupName =
      seasons.find((s) => s.artistGroupId === data.artistGroupId)?.artistGroupName ?? '그룹';
    const now = new Date();
    const startDate = new Date(data.startAt.replace(/\./g, '-').replace(' ', 'T'));
    const endDate = new Date(data.endAt.replace(/\./g, '-').replace(' ', 'T'));
    let status: DukSeasonStatus = '예정';
    if (now >= startDate && now <= endDate) status = '진행중';
    else if (now > endDate) status = '종료';

    const nextId = Math.max(...seasons.map((s) => s.id)) + 1;
    setSeasons((prev) => [
      ...prev,
      {
        id: nextId,
        artistGroupId: data.artistGroupId,
        artistGroupName: groupName,
        name: data.name,
        startAt: data.startAt,
        endAt: data.endAt,
        status,
      },
    ]);
    toast.success('시즌이 저장되었습니다.');
    setRegisterOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          그룹별 랭킹 시즌을 생성합니다. 시즌 row를 클릭하면 상세 페이지로 이동하여 월별 보상을 설정할 수 있습니다. 같은 그룹에 진행중 시즌은 1개만 운영됩니다.
        </p>
        <button
          onClick={() => setRegisterOpen(true)}
          className="h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          + 신규 시즌
        </button>
      </div>

      <SimpleTable
        columns={[
          { key: 'artistGroupName', label: '그룹' },
          { key: 'name', label: '시즌명' },
          {
            key: 'range',
            label: '기간',
            render: (r: DukSeason) => `${r.startAt} ~ ${r.endAt}`,
          },
          {
            key: 'status',
            label: '상태',
            render: (r: DukSeason) => (
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[r.status]}`}
              >
                {r.status}
              </span>
            ),
          },
        ]}
        rows={slice}
        emptyMessage="등록된 시즌이 없습니다."
        onRowClick={(r) => router.push(`/artists/duk/seasons/${r.id}`)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />

      <SeasonFormModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        mode="create"
        existingSeasons={seasons}
        onSubmit={handleCreate}
      />
    </div>
  );
}
