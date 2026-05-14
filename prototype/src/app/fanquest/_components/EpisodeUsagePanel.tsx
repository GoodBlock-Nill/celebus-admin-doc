'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getFanQuestUsages, type FanQuestUsage } from '@/mock/fanquest';
import type { EpisodeGroupStatus, StoryQuestStatus } from '@/mock/sq';

const GROUP_BADGE: Record<EpisodeGroupStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-400 text-white',
};

const STORY_BADGE: Record<StoryQuestStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-400 text-white',
};

const GROUP_LABEL: Record<EpisodeGroupStatus, string> = {
  DRAFT: '임시저장',
  ACTIVE: '진행중',
  CLOSED: '종료',
};

const STORY_LABEL: Record<StoryQuestStatus, string> = {
  DRAFT: '임시저장',
  ACTIVE: '진행중',
  CLOSED: '종료',
};

interface Props {
  fanQuestId: number;
  variant?: 'card' | 'banner' | 'modal-list';
}

export default function EpisodeUsagePanel({ fanQuestId, variant = 'card' }: Props) {
  const usages = useMemo(() => getFanQuestUsages(fanQuestId), [fanQuestId]);

  if (variant === 'card') return <UsageCard usages={usages} />;
  if (variant === 'banner') return <UsageBanner usages={usages} />;
  return <UsageModalList usages={usages} />;
}

// ─────────────────────────────────────────────
// 1) 카드 — 상세 페이지 InfoTab 하단
// ─────────────────────────────────────────────

function UsageCard({ usages }: { usages: FanQuestUsage[] }) {
  const router = useRouter();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900">
          사용 중인 에피소드 <span className="text-gray-400 font-normal">({usages.length})</span>
        </h4>
        <p className="text-[11px] text-gray-400">
          이 Quest를 참조하는 SQ 에피소드 목록입니다.
        </p>
      </div>

      {usages.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">
          이 Quest를 사용하는 에피소드가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <div className="grid grid-cols-[1.4fr_1.4fr_1fr_88px] bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 border-b border-gray-200">
            <div>에피소드 그룹</div>
            <div>에피소드</div>
            <div>퀘스트(chapter)</div>
            <div className="text-right">바로가기</div>
          </div>
          {usages.map((u) => (
            <button
              key={`${u.storyQuestId}-${u.chapterOrder}`}
              onClick={() => router.push(`/sq/${u.storyQuestId}`)}
              className="w-full grid grid-cols-[1.4fr_1.4fr_1fr_88px] px-4 py-3 text-sm text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${GROUP_BADGE[u.groupStatus]}`}>
                  {GROUP_LABEL[u.groupStatus]}
                </span>
                <span className="text-gray-900 truncate">{u.groupTitle}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STORY_BADGE[u.storyQuestStatus]}`}>
                  {STORY_LABEL[u.storyQuestStatus]}
                </span>
                <span className="text-gray-900 truncate">{u.storyQuestTitle}</span>
              </div>
              <div className="text-gray-600 min-w-0">
                <span className="text-gray-400 text-xs">#{u.chapterOrder}</span>{' '}
                <span className="truncate">{u.chapterTitleKO}</span>
                {u.episodeKind === 'REPEAT' && (
                  <span className="ml-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700">
                    반복
                  </span>
                )}
              </div>
              <div className="text-right text-indigo-600 text-xs font-medium">상세 →</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 2) 배너 — 수정 페이지 상단 (요약 + 펼침)
// ─────────────────────────────────────────────

function UsageBanner({ usages }: { usages: FanQuestUsage[] }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  if (usages.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-start gap-2 text-sm text-amber-900">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">이 Quest는 {usages.length}개의 에피소드에서 사용 중입니다.</span>{' '}
            변경 사항은 모든 사용처에 즉시 반영됩니다.
          </div>
        </div>
        <span className="text-amber-700 shrink-0 ml-3">
          {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <ul className="mt-3 pl-7 space-y-1.5 text-xs text-amber-900">
          {usages.map((u) => (
            <li key={`${u.storyQuestId}-${u.chapterOrder}`}>
              <button
                onClick={() => router.push(`/sq/${u.storyQuestId}`)}
                className="hover:underline text-left"
              >
                <span className="text-amber-600">[{GROUP_LABEL[u.groupStatus]}]</span>{' '}
                {u.groupTitle} — {u.storyQuestTitle} · #{u.chapterOrder} {u.chapterTitleKO}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 3) 모달 리스트 — 종료/삭제 확인 모달 본문
// ─────────────────────────────────────────────

function UsageModalList({ usages }: { usages: FanQuestUsage[] }) {
  if (usages.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
      <div className="text-xs font-semibold text-amber-900 mb-1.5">
        다음 {usages.length}개 에피소드에서 사용 중입니다:
      </div>
      <ul className="space-y-1 text-[11px] text-amber-900 max-h-32 overflow-y-auto">
        {usages.map((u) => (
          <li key={`${u.storyQuestId}-${u.chapterOrder}`}>
            · <span className="text-amber-600">[{GROUP_LABEL[u.groupStatus]}]</span>{' '}
            {u.groupTitle} — {u.storyQuestTitle} <span className="text-amber-600">(#{u.chapterOrder})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
