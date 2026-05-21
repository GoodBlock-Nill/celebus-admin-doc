'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon, PhotoIcon, ChevronUpIcon, ChevronDownIcon, ExclamationTriangleIcon, GiftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import { getStoryQuestById, getEpisodesByStoryId, getGroupById, MAX_EPISODES_PER_STORY, type EpisodeType, type StoryEpisode, type StoryQuest } from '@/mock/sq';

// [CEB-BO-SQ-202] §2-6 정합 — 한국어 유형 라벨 (2026-05-21 sync 정정)
const TYPE_BADGE: Record<EpisodeType, { bg: string; text: string; label: string }> = {
  FAN_QUEST: { bg: 'bg-pink-100', text: 'text-pink-700', label: '팬퀘스트' },
  PREDICTION_MARKET: { bg: 'bg-amber-100', text: 'text-amber-700', label: '예측 마켓' },
  SURVIVAL_TRIVIA: { bg: 'bg-blue-100', text: 'text-blue-700', label: '서바이벌 트리비아' },
};

export default function SqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const storyId = parseInt(id, 10);
  const story = getStoryQuestById(storyId);
  const initialEpisodes = useMemo(() => getEpisodesByStoryId(storyId), [storyId]);
  const [episodes, setEpisodes] = useState<StoryEpisode[]>(initialEpisodes);
  const router = useRouter();
  const group = story ? getGroupById(story.groupId) : undefined;
  const [deleteEpisodeModalOpen, setDeleteEpisodeModalOpen] = useState(false);

  if (!story) return <div className="p-8 text-sm text-gray-500">에피소드를 찾을 수 없습니다.</div>;

  const canAddMission = story.episodeCount < MAX_EPISODES_PER_STORY;
  const canReorder = story.status === 'DRAFT';

  const handleReorder = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= episodes.length) return;
    setEpisodes((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((ep, i) => ({ ...ep, order: i + 1 }));
    });
  };

  return (
    <div>
      <PageHeader title="" breadcrumbItems={[{ label: '에피소드', href: '/sq/groups/list' }, { label: story.titleKO }]} />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 max-w-[640px]">{story.titleKO}</h1>
            <p className="text-sm text-gray-500 mt-1">{story.titleEN}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* [CEB-BO-SQ-202] §2-1 정합 — 유형 배지 한국어 (2026-05-21 sync 정정) */}
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
            story.episodeKind === 'REPEAT' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'
          }`}>{story.episodeKind === 'REPEAT' ? '반복' : '메인'}</span>
          <button
            onClick={() => router.push(`/sq/${storyId}/edit`)}
            className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            수정하기
          </button>
          {/* [CEB-BO-SQ-202] §2-1 정합 — 임시저장 상태에 [삭제] 액션 (2026-05-21 sync 정정) */}
          {story.status === 'DRAFT' && (
            <button
              onClick={() => setDeleteEpisodeModalOpen(true)}
              className="h-10 px-4 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
            >
              삭제
            </button>
          )}
          {story.status === 'DRAFT' ? (
            <button
              onClick={() => alert(`[Mock] 게시 — '${story.titleKO}'`)}
              className="h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              게시하기
            </button>
          ) : story.status === 'ACTIVE' ? (
            <button
              onClick={() => alert(`[Mock] 종료 — '${story.titleKO}'`)}
              className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
            >
              종료하기
            </button>
          ) : null}
        </div>
      </div>

      {/* [CEB-BO-SQ-202-MD-DELETE] 에피소드 삭제 확인 모달 (2026-05-21 sync 정정) */}
      {deleteEpisodeModalOpen && (
        <DeleteEpisodeModal
          story={story}
          missionsCount={episodes.length}
          hasFanQuestMapping={episodes.some((e) => e.type === 'FAN_QUEST' && e.fanQuestId != null)}
          onCancel={() => setDeleteEpisodeModalOpen(false)}
          onConfirm={() => {
            setDeleteEpisodeModalOpen(false);
            alert(`[Mock] 에피소드 '${story.titleKO}' 삭제 완료. 하위 미션 ${episodes.length}건도 함께 삭제. 팬퀘스트 매핑은 자동 해제됨.`);
            router.push(`/sq/groups/${story.groupId}`);
          }}
        />
      )}

      {/* 섹션 1 — 메인 이미지(3:4) + 기본 정보 + 관리 정보 */}
      <div className="grid grid-cols-[200px_1fr_1fr] gap-5 mb-6">
        {/* 메인 이미지 — 3:4 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
            <div className="text-center px-2">
              <PhotoIcon className="w-10 h-10 mx-auto text-indigo-300 mb-1" />
              <span className="text-[11px] text-indigo-500 font-medium">메인 이미지 (3:4)</span>
            </div>
            <span className="absolute top-2 right-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-white/80 backdrop-blur text-gray-700 border border-gray-200">
              에피소드 이미지
            </span>
          </div>
          <div className="px-3 py-2 border-t border-gray-100 text-[10px] flex items-center justify-between">
            <span className="text-gray-500 font-mono truncate max-w-[120px]">{story.imageUrl}</span>
            <button
              onClick={() => router.push(`/sq/${storyId}/edit`)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              변경 →
            </button>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">기본 정보</h4>
          <div className="space-y-3 text-sm">
            <Row label="아티스트" value={story.artistGroup} />
            <Row label="에피소드 종류" value={story.episodeKind === 'REPEAT' ? '반복' : '메인'} />
            <Row label="상위 그룹" value={group?.titleKO ?? '—'} />
            <Row label="그룹 기간" value={group ? `${group.startDt} ~ ${group.endDt}` : '—'} />
            <Row label="표시 순서" value={`#${story.displayOrder}`} />
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="text-xs text-gray-500 mb-2">다국어 타이틀</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2"><span className="inline-flex items-center justify-center w-7 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">KO</span><span className="text-gray-900 flex-1">{story.titleKO}</span></div>
                <div className="flex items-start gap-2"><span className="inline-flex items-center justify-center w-7 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">EN</span><span className="text-gray-700 flex-1">{story.titleEN || '(미입력)'}</span></div>
                <div className="flex items-start gap-2"><span className="inline-flex items-center justify-center w-7 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">JA</span><span className="text-gray-700 flex-1">{story.titleJA || '(미입력)'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* 관리 정보 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">관리 정보</h4>
          <div className="space-y-3 text-sm">
            <Row label="생성자" value={story.createdBy} />
            <Row label="생성 일시" value={story.createdAt} />
            <Row label="최근 수정자" value={story.updatedBy} />
            <Row label="최근 수정 일시" value={story.updatedAt} />
          </div>
        </div>
      </div>

      {/* 섹션 1-b — 다국어 설명 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">에피소드 설명</h4>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <DescBlock lang="KO" value={story.descKO} />
          <DescBlock lang="EN" value={story.descEN} />
          <DescBlock lang="JA" value={story.descJA} />
        </div>
      </div>

      {/* [CEB-BO-SQ-202] §2-3 v3.1 정합 — 에피소드 완료 보상 카드 (메인 에피소드 전용, 2026-05-21 sync 정정) */}
      {story.episodeKind === 'MAIN' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GiftIcon className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-semibold text-gray-900">에피소드 완료 보상</h4>
            </div>
            <span className="text-xs text-gray-500">모든 미션 완료 회원에게 자동 지급</span>
          </div>
          {story.episodeReward ? (
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">응모권</div>
                <div className="text-base font-semibold text-gray-900">
                  {story.episodeReward.entryTicket > 0 ? `${story.episodeReward.entryTicket} 장` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">덕력</div>
                <div className="text-base font-semibold text-gray-900">
                  {story.episodeReward.fanPoint > 0 ? story.episodeReward.fanPoint.toLocaleString('ko-KR') : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">BIVE 보상</div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  story.episodeReward.biveRewardYn
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {story.episodeReward.biveRewardYn ? '지급' : '미지급'}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">민팅 캠페인</div>
                <div className="text-sm text-gray-900">
                  {story.episodeReward.biveRewardYn && story.episodeReward.mintingEventName
                    ? story.episodeReward.mintingEventName
                    : '—'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">보상 없음 (모든 값 0/OFF)</div>
          )}
        </div>
      )}

      {/* 섹션 2 — 진행 통계 4카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label={`총 미션 (최대 ${MAX_EPISODES_PER_STORY})`} count={story.episodeCount} variant="default" />
        <StatCardWithBar label="진행 회원" count={story.activeMembers} variant="active" />
        <StatCardWithBar label="미션 완료" count={story.totalCompleted} variant="active" />
        <StatCardWithBar label="검수 대기" count={story.pendingReview} variant={story.pendingReview > 0 ? 'pending' : 'inactive'} />
      </div>

      {/* 섹션 3 — 미션 카드 그리드 (BIVE 보상 토글) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">미션 ({story.episodeCount}/{MAX_EPISODES_PER_STORY})</h4>
            {!canAddMission && (
              <span className="text-xs text-amber-600">최대치 도달</span>
            )}
            {canReorder && (
              <span className="text-[11px] text-gray-500">↑↓ 버튼으로 순서 변경</span>
            )}
          </div>
          {story.status !== 'CLOSED' && (
            <button
              onClick={() => router.push(`/sq/${storyId}/quests/create`)}
              disabled={!canAddMission}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
              title={canAddMission ? undefined : `에피소드당 미션은 최대 ${MAX_EPISODES_PER_STORY}개입니다`}
            >
              <PlusIcon className="w-4 h-4" />미션 추가
            </button>
          )}
        </div>

        {episodes.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            미션이 아직 없습니다. [+ 미션 추가]로 시작하세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {episodes.map((ep, idx) => {
              const typeBadge = TYPE_BADGE[ep.type];
              const isFirst = idx === 0;
              const isLast = idx === episodes.length - 1;
              return (
                <div
                  key={ep.id}
                  className="relative bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  {/* 순서 변경 버튼 (DRAFT만 활성) */}
                  <div className="absolute top-3 right-3 flex flex-col gap-0.5 z-10">
                    <button
                      type="button"
                      aria-label="위로 이동"
                      onClick={(e) => { e.stopPropagation(); handleReorder(idx, -1); }}
                      disabled={!canReorder || isFirst}
                      title={!canReorder ? 'DRAFT 상태에서만 순서 변경 가능' : isFirst ? '이미 첫 번째 미션' : '위로 이동'}
                      className="w-6 h-6 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <ChevronUpIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="아래로 이동"
                      onClick={(e) => { e.stopPropagation(); handleReorder(idx, 1); }}
                      disabled={!canReorder || isLast}
                      title={!canReorder ? 'DRAFT 상태에서만 순서 변경 가능' : isLast ? '이미 마지막 미션' : '아래로 이동'}
                      className="w-6 h-6 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/sq/${storyId}/quests/${ep.id}`)}
                    className="text-left w-full"
                  >
                    {/* 헤더 — 순서 + 유형 배지 */}
                    <div className="flex items-center gap-2 mb-3 pr-16">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 text-[11px] font-bold text-gray-700">
                        <span className="text-gray-400">#</span>{ep.order} / {MAX_EPISODES_PER_STORY}
                      </span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBadge.bg} ${typeBadge.text}`}>
                        {typeBadge.label}
                      </span>
                    </div>

                    {/* 타이틀 */}
                    <h5 className="text-sm font-bold text-gray-900 mb-4 line-clamp-2 min-h-[2.5rem]">{ep.titleKO}</h5>

                    {/* 통계 3행 — 보상 + BIVE */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">응모권</span>
                        <span className="text-emerald-600 font-medium">+{ep.rewardEntryTicket}장</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">덕력</span>
                        <span className="text-emerald-600 font-medium">+{ep.rewardFanPoint}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">BIVE 보상</span>
                        {ep.biveRewardYn ? (
                          <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold">
                            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />ON
                          </span>
                        ) : (
                          <span className="text-gray-400">OFF</span>
                        )}
                      </div>
                    </div>

                    {ep.biveRewardYn && ep.mintingEventName && (
                      <div className="text-[10px] text-indigo-600 bg-indigo-50 rounded px-2 py-1 mt-3">
                        🎁 {ep.mintingEventName}
                      </div>
                    )}

                    {/* 진행/완료 */}
                    <div className="border-t border-gray-100 mt-4 pt-2 flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">진행/완료</span>
                      <span className="text-gray-900 font-medium">{ep.completedMembers}/{ep.inProgressMembers}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
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

function DescBlock({ lang, value }: { lang: 'KO' | 'EN' | 'JA'; value: string }) {
  return (
    <div>
      <span className="inline-flex items-center justify-center min-w-[26px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold mb-2">
        {lang}
      </span>
      <p className={`leading-relaxed whitespace-pre-line ${value ? 'text-gray-700' : 'text-gray-400 italic'}`}>
        {value || '(미입력)'}
      </p>
    </div>
  );
}

// [CEB-BO-SQ-202-MD-DELETE] 에피소드 삭제 확인 모달 (2026-05-21 sync 정정)
function DeleteEpisodeModal({
  story,
  missionsCount,
  hasFanQuestMapping,
  onCancel,
  onConfirm,
}: {
  story: StoryQuest;
  missionsCount: number;
  hasFanQuestMapping: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-gray-900">에피소드를 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-600 mt-1">복구할 수 없습니다.</p>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-rose-900 mb-2">삭제 영향</p>
          <ul className="text-xs text-rose-800 space-y-1">
            <li>• 에피소드: '{story.titleKO}'</li>
            <li>• 하위 미션 {missionsCount}건도 함께 삭제됩니다</li>
            {hasFanQuestMapping && (
              <li>• 팬퀘스트 매핑이 자동 해제됩니다 (팬퀘스트 자체는 보존)</li>
            )}
            <li>• 부모 그룹의 에피소드 수가 자동 감소합니다</li>
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

