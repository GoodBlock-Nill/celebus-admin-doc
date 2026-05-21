'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import {
  getGroupById,
  getMainEpisodesByGroupId,
  getRepeatEpisodeByGroupId,
  canAddMainEpisode,
  canAddRepeatEpisode,
  MAX_MAIN_EPISODES,
  MAX_REPEAT_EPISODES,
  type EpisodeGroupStatus,
  type StoryQuest,
} from '@/mock/sq';

const GROUP_STATUS_STYLE: Record<EpisodeGroupStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

export default function GroupDetailPage({ params }: { params: Promise<{ gid: string }> }) {
  const { gid } = use(params);
  const groupId = parseInt(gid, 10);
  const group = getGroupById(groupId);
  const mainEpisodes = getMainEpisodesByGroupId(groupId);
  const repeatEpisode = getRepeatEpisodeByGroupId(groupId);
  const allEpisodes: StoryQuest[] = repeatEpisode ? [...mainEpisodes, repeatEpisode] : mainEpisodes;
  const router = useRouter();

  if (!group) return <div className="p-8 text-sm text-gray-500">에피소드 그룹을 찾을 수 없습니다.</div>;

  const totalActiveMembers = allEpisodes.reduce((s, e) => s + e.activeMembers, 0);
  const totalPending = allEpisodes.reduce((s, e) => s + e.pendingReview, 0);
  const canAddMain = canAddMainEpisode(groupId);
  const canAddRepeat = canAddRepeatEpisode(groupId);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const episodes = allEpisodes;

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '에피소드', href: '/sq/groups/list' },
          { label: '그룹 리스트', href: '/sq/groups/list' },
          { label: group.titleKO },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 max-w-[640px]">{group.titleKO}</h1>
            <p className="text-sm text-gray-500 mt-1">
              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 mr-2">
                {group.artistGroup}
              </span>
              {group.startDt} ~ {group.endDt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${GROUP_STATUS_STYLE[group.status]}`}>
            {group.status}
          </span>
          <button
            onClick={() => router.push(`/sq/groups/${groupId}/edit`)}
            className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            그룹 수정
          </button>
          {/* [CEB-BO-SQ-201] §2-1 정합 — 임시저장 상태에 [그룹 삭제] 액션 (2026-05-21 sync 정정) */}
          {group.status === 'DRAFT' && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="h-10 px-4 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
            >
              그룹 삭제
            </button>
          )}
          {group.status === 'DRAFT' ? (
            <button
              onClick={() => alert(`[Mock] 그룹 진행중 전환 — 아티스트당 진행중 1개 검증 후 진행`)}
              className="h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              진행중 전환
            </button>
          ) : group.status === 'ACTIVE' ? (
            <button
              onClick={() => alert(`[Mock] 그룹 종료 전환 — '${group.titleKO}'`)}
              className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
            >
              종료 전환
            </button>
          ) : null}
        </div>
      </div>

      {/* [CEB-BO-SQ-201-MD-DELETE] 그룹 삭제 확인 모달 (2026-05-21 sync 정정) */}
      {deleteModalOpen && (
        <DeleteGroupModal
          group={group}
          episodesCount={episodes.length}
          missionsCount={episodes.reduce((sum, ep) => sum + (ep.episodeCount ?? 0), 0)}
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={() => {
            setDeleteModalOpen(false);
            alert(`[Mock] 그룹 '${group.titleKO}' 삭제 완료. 하위 에피소드·미션도 모두 삭제됨.`);
            router.push('/sq/groups/list');
          }}
        />
      )}

      {/* 섹션 1 — 그룹 정보 카드 */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">그룹 정보</h4>
          <div className="space-y-3 text-sm">
            <Row label="아티스트" value={group.artistGroup} />
            <Row label="시작일자" value={group.startDt} />
            <Row label="종료일자" value={group.endDt} />
            <Row label="상태" value={group.status} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">관리 정보</h4>
          <div className="space-y-3 text-sm">
            <Row label="생성자" value={group.createdBy} />
            <Row label="생성 일시" value={group.createdAt} />
            <Row label="최근 수정자" value={group.updatedBy} />
            <Row label="최근 수정 일시" value={group.updatedAt} />
          </div>
        </div>
      </div>

      {/* 섹션 2 — 그룹 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label={`메인 (${mainEpisodes.length}/${MAX_MAIN_EPISODES})`} count={mainEpisodes.length} variant="default" />
        <StatCardWithBar label={`반복 (${repeatEpisode ? 1 : 0}/${MAX_REPEAT_EPISODES})`} count={repeatEpisode ? 1 : 0} variant="active" />
        <StatCardWithBar label="진행 회원" count={totalActiveMembers} variant="active" />
        <StatCardWithBar label="검수 대기" count={totalPending} variant={totalPending > 0 ? 'pending' : 'inactive'} />
      </div>

      {/* 섹션 3-A — 메인 에피소드 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">메인 에피소드 ({mainEpisodes.length}/{MAX_MAIN_EPISODES})</h4>
            {!canAddMain && <span className="text-xs text-amber-600">최대치 도달</span>}
          </div>
          {group.status !== 'CLOSED' && (
            <button
              onClick={() => router.push(`/sq/create?groupId=${groupId}&kind=MAIN`)}
              disabled={!canAddMain}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" />새 메인 에피소드
            </button>
          )}
        </div>

        {mainEpisodes.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            메인 에피소드가 아직 없습니다. [+ 새 메인 에피소드]로 시작하세요.
          </div>
        ) : (
          <>
            <div className="px-5 py-2 border-b border-gray-100 bg-amber-50 text-[11px] text-amber-800">
              메인 에피소드는 displayOrder 1~5로 정렬됩니다. <strong>순서 변경은 그룹이 DRAFT 상태일 때만 가능</strong>합니다.
              {group.status !== 'DRAFT' && <span className="ml-1 text-amber-700">(현재 그룹 상태: {group.status} — 순서 변경 잠금)</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {mainEpisodes.map((ep, idx) => (
                <EpisodeCard
                  key={ep.id}
                  ep={ep}
                  idx={idx}
                  total={mainEpisodes.length}
                  groupStatus={group.status}
                  onCardClick={() => router.push(`/sq/${ep.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 섹션 3-B — 반복 에피소드 */}
      <div className="bg-white border border-violet-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-violet-100 bg-violet-50/50">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-violet-900">반복 에피소드 ({repeatEpisode ? 1 : 0}/{MAX_REPEAT_EPISODES})</h4>
            <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-violet-600 text-white">REPEAT</span>
          </div>
          {group.status !== 'CLOSED' && (
            <button
              onClick={() => router.push(`/sq/create?groupId=${groupId}&kind=REPEAT`)}
              disabled={!canAddRepeat}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 bg-violet-100 border border-violet-200 rounded-lg hover:bg-violet-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" />반복 에피소드 추가
            </button>
          )}
        </div>

        {!repeatEpisode ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            반복 에피소드가 아직 없습니다. 그룹 기간 동안 반복 가능한 콘텐츠를 묶으려면 [+ 반복 에피소드 추가]로 1개를 등록하세요.
          </div>
        ) : (
          <div className="p-5 max-w-sm">
            <EpisodeCard
              ep={repeatEpisode}
              idx={0}
              total={1}
              groupStatus={group.status}
              onCardClick={() => router.push(`/sq/${repeatEpisode.id}`)}
              isRepeat
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EpisodeCard({
  ep,
  idx,
  total,
  groupStatus,
  onCardClick,
  isRepeat = false,
}: {
  ep: StoryQuest;
  idx: number;
  total: number;
  groupStatus: EpisodeGroupStatus;
  onCardClick: () => void;
  isRepeat?: boolean;
}) {
  return (
    <div className={`text-left bg-white border ${isRepeat ? 'border-violet-200' : 'border-gray-200'} rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all`}>
      <div className={`aspect-[3/4] flex items-center justify-center text-[11px] font-medium relative ${
        isRepeat
          ? 'bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-500'
          : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-400'
      }`}>
        에피소드 메인 이미지 (3:4)
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 backdrop-blur text-[11px] font-bold border ${
            isRepeat ? 'text-violet-700 border-violet-200' : 'text-gray-700 border-gray-200'
          }`}>
            <span className="text-gray-400">#</span>{ep.displayOrder}
          </span>
          {!isRepeat && (
            <div className="flex flex-col gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (idx === 0) return;
                  alert(`[Mock] 순서 위로 이동 — '${ep.titleKO}' (현재 #${ep.displayOrder} → #${ep.displayOrder - 1})`);
                }}
                disabled={idx === 0 || groupStatus !== 'DRAFT'}
                className="w-5 h-5 inline-flex items-center justify-center rounded bg-white/90 border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="순서 위로"
              >
                <ChevronUpIcon className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (idx === total - 1) return;
                  alert(`[Mock] 순서 아래로 이동 — '${ep.titleKO}' (현재 #${ep.displayOrder} → #${ep.displayOrder + 1})`);
                }}
                disabled={idx === total - 1 || groupStatus !== 'DRAFT'}
                className="w-5 h-5 inline-flex items-center justify-center rounded bg-white/90 border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="순서 아래로"
              >
                <ChevronDownIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        {isRepeat && (
          <span className="absolute top-2 right-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold bg-violet-600 text-white">
            REPEAT
          </span>
        )}
      </div>
      <button onClick={onCardClick} className="block w-full text-left p-4">
        <div className="flex items-center justify-end mb-2">
          <span className="text-[11px] text-gray-400 font-medium">미션 {ep.episodeCount}/10</span>
        </div>
        <h5 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">{ep.titleKO}</h5>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">기간</span>
            <span className="text-gray-400 text-[10px] italic">그룹과 동일</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">진행/완료</span>
            <span className="text-gray-900 font-medium">{ep.activeMembers} / {ep.totalCompleted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">검수 대기</span>
            {ep.pendingReview > 0 ? (
              <span className="text-amber-600 font-semibold">{ep.pendingReview}</span>
            ) : (
              <span className="text-gray-400">0</span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

// [CEB-BO-SQ-201-MD-DELETE] 그룹 삭제 확인 모달 (2026-05-21 sync 정정)
function DeleteGroupModal({
  group,
  episodesCount,
  missionsCount,
  onCancel,
  onConfirm,
}: {
  group: StoryQuest extends never ? never : { titleKO: string };
  episodesCount: number;
  missionsCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-gray-900">에피소드 그룹을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-600 mt-1">복구할 수 없습니다.</p>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-rose-900 mb-2">삭제 영향</p>
          <ul className="text-xs text-rose-800 space-y-1">
            <li>• 그룹: '{group.titleKO}'</li>
            <li>• 하위 에피소드 {episodesCount}건도 함께 삭제됩니다</li>
            <li>• 하위 미션 {missionsCount}건도 함께 삭제됩니다</li>
            <li>• 미션의 팬퀘스트 매핑이 자동 해제됩니다 (팬퀘스트 자체는 보존)</li>
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 px-4 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
