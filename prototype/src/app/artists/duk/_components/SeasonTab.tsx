'use client';

import { useMemo, useState } from 'react';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { toast } from '@/components/ui/Toast';
import SeasonFormModal from './SeasonFormModal';
import { dukSeasons as initialSeasons, type DukSeason, type DukSeasonStatus } from '@/mock/duk';

// [CEB-BO-ART-401] §2-1 탭 1 — 랭킹 시즌 설정
// - 그룹별 시즌 리스트 + [신규 시즌] + [수정]·[종료] 액션
// - 그룹별 진행중 시즌 1개 제한 검증 (SeasonFormModal에 위임)

const STATUS_BADGE: Record<DukSeasonStatus, string> = {
  예정: 'bg-gray-100 text-gray-700',
  진행중: 'bg-emerald-100 text-emerald-700',
  종료: 'bg-gray-900 text-white',
};

const PAGE_SIZE = 20;

export default function SeasonTab() {
  const [seasons, setSeasons] = useState<DukSeason[]>(initialSeasons);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DukSeason | null>(null);
  const [closeTarget, setCloseTarget] = useState<DukSeason | null>(null);
  const [page, setPage] = useState(1);

  // 시작일시 내림차순 정렬
  const sorted = useMemo(() => [...seasons].sort((a, b) => (a.startAt < b.startAt ? 1 : -1)), [seasons]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const slice = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeSeasons = useMemo(() => seasons.filter((s) => s.status === '진행중'), [seasons]);

  const handleSave = (data: { artistGroupId: number; name: string; startAt: string; endAt: string }) => {
    const groupName = seasons.find((s) => s.artistGroupId === data.artistGroupId)?.artistGroupName
      ?? '그룹';
    if (editTarget) {
      // 수정
      setSeasons((prev) =>
        prev.map((s) =>
          s.id === editTarget.id
            ? { ...s, name: data.name, startAt: data.startAt, endAt: data.endAt }
            : s,
        ),
      );
      toast.success('시즌이 저장되었습니다.');
      setEditTarget(null);
    } else {
      // 생성 — 기본 상태는 시작일시 기준 자동 결정 (간단히 '예정' 처리. 실제 운영은 서버 시각 비교)
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
    }
    setRegisterOpen(false);
  };

  const handleClose = () => {
    if (!closeTarget) return;
    setSeasons((prev) =>
      prev.map((s) => (s.id === closeTarget.id ? { ...s, status: '종료' } : s)),
    );
    toast.success('시즌이 종료되었습니다.');
    setCloseTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">그룹별 랭킹 시즌을 생성·수정·종료합니다. 같은 그룹에 진행중 시즌은 1개만 운영됩니다.</p>
        <button
          onClick={() => {
            setEditTarget(null);
            setRegisterOpen(true);
          }}
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
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                {r.status}
              </span>
            ),
          },
          {
            key: 'actions',
            label: '액션',
            align: 'right',
            render: (r: DukSeason) =>
              r.status === '종료' ? (
                <span className="text-xs text-gray-400">—</span>
              ) : (
                <div className="inline-flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditTarget(r);
                      setRegisterOpen(true);
                    }}
                    className="px-3 h-8 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    수정
                  </button>
                  {r.status === '진행중' && (
                    <button
                      onClick={() => setCloseTarget(r)}
                      className="px-3 h-8 text-xs font-medium text-rose-600 bg-white border border-rose-200 rounded-md hover:bg-rose-50"
                    >
                      종료
                    </button>
                  )}
                </div>
              ),
          },
        ]}
        rows={slice}
        emptyMessage="등록된 시즌이 없습니다."
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />

      <SeasonFormModal
        isOpen={registerOpen}
        onClose={() => {
          setRegisterOpen(false);
          setEditTarget(null);
        }}
        mode={editTarget ? 'edit' : 'create'}
        initial={editTarget ?? undefined}
        existingActiveSeasons={activeSeasons}
        onSubmit={handleSave}
      />

      {/* 종료 확인 모달 */}
      {closeTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCloseTarget(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-base font-semibold text-gray-900">시즌을 종료하시겠습니까?</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700">
                {closeTarget.artistGroupName} - {closeTarget.name} 시즌을 종료합니다. 종료 후 본 시즌의 랭킹은 확정 보존되며 신규 적립/소비는 다음 시즌에 귀속됩니다.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setCloseTarget(null)}
                className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleClose}
                className="h-10 px-5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
              >
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
