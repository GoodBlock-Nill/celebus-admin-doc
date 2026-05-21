'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import {
  getStoryQuestById,
  getEpisodeById,
  type EpisodeType,
  type EpisodeCompletedType,
} from '@/mock/sq';

const TYPE_BADGE: Record<EpisodeType, { bg: string; text: string; label: string }> = {
  FAN_QUEST: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'FAN_QUEST' },
  PREDICTION_MARKET: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'PREDICTION_MARKET' },
  SURVIVAL_TRIVIA: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'SURVIVAL_TRIVIA' },
};

const COMPLETED_TYPE_LABEL: Record<EpisodeCompletedType, { label: string; bg: string; text: string }> = {
  ADMIN_APPROVAL: { label: '관리자 승인', bg: 'bg-violet-100', text: 'text-violet-700' },
  PM_PARTICIPATION: { label: 'PM 참여', bg: 'bg-amber-100', text: 'text-amber-700' },
  PM_CORRECT: { label: 'PM 정답', bg: 'bg-orange-100', text: 'text-orange-700' },
  TRIVIA_PARTICIPATION: { label: '트리비아 참여', bg: 'bg-blue-100', text: 'text-blue-700' },
  TRIVIA_CORRECT_COUNT: { label: '트리비아 N문항 정답', bg: 'bg-sky-100', text: 'text-sky-700' },
};

export default function QuestDetailPage({ params }: { params: Promise<{ id: string; qid: string }> }) {
  const { id, qid } = use(params);
  const storyId = parseInt(id, 10);
  const questId = parseInt(qid, 10);
  const story = getStoryQuestById(storyId);
  const quest = getEpisodeById(questId);
  const router = useRouter();

  if (!story || !quest) {
    return <div className="p-8 text-sm text-gray-500">미션을 찾을 수 없습니다.</div>;
  }

  const typeBadge = TYPE_BADGE[quest.type];
  const ct = quest.completedType ? COMPLETED_TYPE_LABEL[quest.completedType] : null;
  const completionRate = quest.inProgressMembers > 0
    ? (quest.completedMembers / quest.inProgressMembers) * 100
    : 0;

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '에피소드', href: '/sq/groups/list' },
          { label: story.titleKO, href: `/sq/${storyId}` },
          { label: `미션 ${quest.order}` },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 max-w-[640px]">{quest.titleKO}</h1>
            <p className="text-sm text-gray-500 mt-1">
              에피소드: {story.titleKO}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
            {typeBadge.label}
          </span>
          <button
            onClick={() => alert(`[Mock] 미션 수정 (SQ-204-EDIT) — '${quest.titleKO}'`)}
            className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            수정하기
          </button>
          <button
            onClick={() => alert(`[Mock] 미션 삭제 모달 — '${quest.titleKO}'`)}
            className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
          >
            삭제하기
          </button>
        </div>
      </div>

      {/* 섹션 1 — 기본 정보 + BIVE 보상 (2열) */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">기본 정보</h4>
          <div className="space-y-3 text-sm">
            <Row label="순서" value={`${quest.order} / 10`} />
            <Row label="유형" value={typeBadge.label} />
            <Row label="반복 여부" value={quest.repeat ? '반복' : '단일'} />
            <Row label="응모권 보상" value={`${quest.rewardEntryTicket}장`} />
            <Row label="팬덤 포인트 보상" value={quest.rewardFanPoint.toLocaleString('ko-KR')} />
          </div>
          <div className="border-t border-gray-100 pt-3 mt-3 text-[11px] text-gray-500 leading-relaxed">
            메인 이미지는 상위 <strong>에피소드</strong>에서 한 번 등록하여 모든 미션이 공통 사용합니다.
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">BIVE 보상</h4>
          {quest.biveRewardYn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />ON
                </span>
                <span className="text-xs text-gray-500">완료 시 BIVE NFT 자동 민팅</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <div className="text-[11px] text-indigo-600 mb-1">민팅 이벤트</div>
                <div className="text-sm font-bold text-indigo-900">🎁 {quest.mintingEventName}</div>
                <div className="text-[11px] text-indigo-700 font-mono mt-1">eventId: {quest.mintingEventId}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200">
                  OFF
                </span>
                <span className="text-xs text-gray-500">BIVE NFT 미지급</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 leading-relaxed">
                본 미션 완료 시 BIVE 민팅이 발생하지 않습니다. 활성화하려면 [수정하기] 후 BIVE 보상 토글 ON 선택 + 민팅 이벤트 지정 필요.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 섹션 2 — 완료 판정 정보 (chapter 흡수 필드) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">완료 판정</h4>
        <div className="grid grid-cols-2 gap-5 text-sm">
          <div className="space-y-3">
            <Row label="판정 유형" value={ct ? ct.label : '관리자 승인 (FAN_QUEST)'} />
            {quest.completedValue != null && (
              <Row label="기준 수치" value={`${quest.completedValue}회`} />
            )}
            {quest.type !== 'FAN_QUEST' && (
              <Row label="조건 내용" value={quest.sourceRefName ?? '—'} />
            )}
            {quest.type === 'FAN_QUEST' && quest.fanQuestId != null && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500 shrink-0">연결된 팬퀘스트</span>
                {/* [CEB-BO-SQ-204] §2-6 정합 — 팬퀘스트 상세 링크 (2026-05-21 sync 정정) */}
                <button
                  type="button"
                  onClick={() => router.push(`/sq/quests/${quest.fanQuestId}?tab=info`)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium underline-offset-2 hover:underline"
                >
                  팬퀘스트 #{quest.fanQuestId} →
                </button>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {/* [CEB-BO-SQ-204] §2-4 v3.1 정합 — 반복 주기 4종 한국어 (2026-05-21 sync 정정) */}
            <Row
              label="반복 주기"
              value={
                quest.repeatCycle === 'DAILY' ? '일간'
                : quest.repeatCycle === 'WEEKLY' ? '주간'
                : quest.repeatCycle === 'MONTHLY' ? '월간'
                : '없음'
              }
            />
            <Row label="시작" value={quest.openDt ?? '그룹 기간 상속'} />
            <Row label="종료" value={quest.closeDt ?? '그룹 기간 상속'} />
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3 mt-4 text-[11px] text-gray-500 leading-relaxed">
          v2.2부터 <strong>완료 조건은 미션에 직접 흡수</strong>됩니다. 미션 1개 = 완료 판정 1개.
        </div>
      </div>

      {/* 섹션 3 — 진행 통계 3카드 + 완료율 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardWithBar label="진행 회원" count={quest.inProgressMembers} variant="active" />
        <StatCardWithBar label="완료 회원" count={quest.completedMembers} variant="active" />
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="h-1 bg-emerald-300" />
          <div className="p-5">
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium mb-3 bg-emerald-100 text-emerald-700">완료율</span>
            <p className="text-3xl font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
          </div>
        </div>
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
