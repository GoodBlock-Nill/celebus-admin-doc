'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import { useQuestStore } from '@/stores/useQuestStore';
import RejectReasonModal from '@/components/quest/RejectReasonModal';
import type { QuestChapter, QuestMission } from '@/lib/types';

interface TimelineNodeProps {
  chapter: QuestChapter;
  isExpanded: boolean;
  isLast: boolean;
  readOnly?: boolean;
  onTap: () => void;
}

const STATUS_CONFIG = {
  locked: { icon: '🔒', lineColor: 'border-gray-200 border-dashed', textColor: 'text-gray-400' },
  provisional: { icon: '🔓', lineColor: 'border-blue-200 border-dashed', textColor: 'text-blue-600' },
  active: { icon: '🔵', lineColor: 'border-violet-300', textColor: 'text-violet-700' },
  reviewing: { icon: '⏳', lineColor: 'border-amber-300', textColor: 'text-amber-700' },
  cleared: { icon: '✅', lineColor: 'border-green-300', textColor: 'text-green-700' },
};

function getStatusText(chapter: QuestChapter): string {
  const { status, missions } = chapter;
  const approved = missions.filter((m) => m.status === 'APPROVED' || m.status === 'AUTO_COMPLETED').length;
  const submitted = missions.filter((m) => m.status === 'SUBMITTED').length;
  const total = missions.length;

  switch (status) {
    case 'locked':
      return '';
    case 'provisional':
      return `미션 ${total}개`;
    case 'active':
      return `${approved}/${total} 완료`;
    case 'reviewing':
      return submitted > 0
        ? `${approved}/${total} 승인, ${submitted} 확인 중`
        : `${approved}/${total} 승인`;
    case 'cleared':
      return '완료';
  }
}

export default function TimelineNode({ chapter, isExpanded, isLast, readOnly = false, onTap }: TimelineNodeProps) {
  const config = STATUS_CONFIG[chapter.status];
  const statusText = getStatusText(chapter);
  const hasRejected = chapter.missions.some((m) => m.status === 'REJECTED');
  const addToast = useUIStore((s) => s.addToast);
  const claimGoods = useQuestStore((s) => s.claimGoods);

  const handleClaimGoods = () => {
    claimGoods(chapter.id);
    addToast('success', `Grade ${chapter.goodsGrade} '${chapter.goodsName}' 획득!`);
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center w-8 shrink-0">
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0',
            chapter.status === 'locked' ? 'bg-gray-100' : 'bg-white border-2',
            chapter.status === 'active' && 'border-violet-500',
            chapter.status === 'reviewing' && 'border-amber-400',
            chapter.status === 'cleared' && 'border-green-500',
            chapter.status === 'provisional' && 'border-blue-400 border-dashed',
          )}
        >
          <span className="text-xs">{config.icon}</span>
        </div>
        {!isLast && (
          <div className={cn('w-0 flex-1 border-l-2 my-1', config.lineColor)} />
        )}
      </div>

      <div className="flex-1 pb-4 min-w-0">
        <button onClick={onTap} className="w-full text-left">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-semibold', config.textColor)}>
              {chapter.number}장: {chapter.title}
            </span>
            {chapter.status === 'active' && (
              <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">
                진행중
              </span>
            )}
            {hasRejected && (
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                재도전
              </span>
            )}
          </div>
          {statusText && (
            <p className="text-xs text-gray-500 mt-0.5">{statusText}</p>
          )}
        </button>

        {isExpanded && chapter.status !== 'locked' && (
          <div className="mt-2 space-y-2 animate-slideInUp">
            {chapter.missions.map((mission) => (
              <MissionItem key={mission.id} mission={mission} chapterId={chapter.id} readOnly={readOnly} />
            ))}
            {chapter.status === 'cleared' && !chapter.goodsClaimed && (
              <button
                onClick={handleClaimGoods}
                className="w-full mt-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                디지털 굿즈 받기 🎁
              </button>
            )}
            {chapter.status === 'cleared' && chapter.goodsClaimed && (
              <p className="text-xs text-gray-400 mt-2">
                Grade {chapter.goodsGrade} &apos;{chapter.goodsName}&apos; 수령 완료
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const TYPE_ICON = { capture: '📸', trivia: '🧠', pm: '🎯' };

function MissionItem({ mission, chapterId, readOnly }: { mission: QuestMission; chapterId: string; readOnly: boolean }) {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const updateMissionStatus = useQuestStore((s) => s.updateMissionStatus);
  const [showReject, setShowReject] = useState(false);

  const isGameUnavailable = mission.type === 'pm' && mission.gameUnavailable;

  const statusMap = {
    INCOMPLETE: { icon: '☐', label: mission.type === 'trivia' ? '도전하기 →' : '참여하기 →', style: 'text-violet-600 font-medium', tappable: !readOnly && !isGameUnavailable },
    SUBMITTED: { icon: '⏳', label: '확인 중', style: 'text-amber-500', tappable: false },
    APPROVED: { icon: '✅', label: '완료', style: 'text-green-600', tappable: false },
    REJECTED: { icon: '❌', label: '재제출 →', style: 'text-red-600 font-medium', tappable: !readOnly },
    AUTO_COMPLETED: { icon: '✅', label: '완료', style: 'text-green-600', tappable: false },
  };
  const s = statusMap[mission.status];

  const handleTap = () => {
    if (readOnly) return;
    if (isGameUnavailable) {
      addToast('info', '현재 진행중인 PM 게임이 없습니다');
      return;
    }
    if (mission.status === 'REJECTED') {
      setShowReject(true);
      return;
    }
    if (mission.status !== 'INCOMPLETE') return;

    if (mission.type === 'trivia') {
      addToast('info', 'Trivia 게임으로 이동합니다 (딥링크 준비 중)');
    } else if (mission.type === 'pm') {
      addToast('info', 'PM 게임으로 이동합니다 (딥링크 준비 중)');
    } else {
      router.push(`/quest-submit?title=${encodeURIComponent(mission.title)}&reward=${encodeURIComponent(mission.rewardText)}&chapterId=${chapterId}&missionId=${mission.id}`);
    }
  };

  const handleRetry = () => {
    setShowReject(false);
    router.push(`/quest-submit?title=${encodeURIComponent(mission.title)}&reward=${encodeURIComponent(mission.rewardText)}&chapterId=${chapterId}&missionId=${mission.id}`);
  };

  return (
    <>
      <button
        onClick={handleTap}
        disabled={!s.tappable && mission.status !== 'INCOMPLETE'}
        className={cn(
          'w-full bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 text-left',
          (s.tappable || isGameUnavailable) && 'active:scale-[0.98] transition-transform'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm shrink-0">{TYPE_ICON[mission.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-gray-800 truncate">{mission.title}</p>
              {(mission.type === 'trivia' || mission.type === 'pm') && mission.status === 'INCOMPLETE' && (
                <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full shrink-0">자동검증</span>
              )}
            </div>
            {(mission.status === 'APPROVED' || mission.status === 'AUTO_COMPLETED') && (
              <p className="text-[10px] text-green-600 mt-0.5">{mission.rewardText} 획득</p>
            )}
            {isGameUnavailable && mission.status === 'INCOMPLETE' && (
              <p className="text-[10px] text-amber-500 mt-0.5">⏸️ 게임 준비중 · 알림 설정</p>
            )}
          </div>
          <span className={cn('text-xs shrink-0', isGameUnavailable ? 'text-amber-500' : s.style)}>
            {isGameUnavailable ? '알림 설정' : s.label}
          </span>
        </div>
      </button>
      {showReject && (
        <RejectReasonModal
          reasonCode={mission.rejectReasonCode || 'IMG_BLUR'}
          reasonText={mission.rejectReasonText}
          onRetry={handleRetry}
          onClose={() => setShowReject(false)}
        />
      )}
    </>
  );
}
