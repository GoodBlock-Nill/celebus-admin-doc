import type { Chapter } from '@/lib/fq-types';
import { useFQStore } from '@/stores/useFQStore';

interface RewardPreviewProps {
  chapter: Chapter;
}

export default function RewardPreview({ chapter }: RewardPreviewProps) {
  const season = useFQStore((s) => s.season);
  const isCompleted = chapter.status === 'COMPLETED';

  return (
    <div className="p-3 bg-gradient-to-br from-violet-50 to-pink-50 rounded-xl border border-violet-100">
      <p className="text-[10px] font-semibold text-violet-600 mb-2">
        {isCompleted ? '✅ 수령한 보상' : '🎁 클리어 보상'}
      </p>

      {/* Always rewards */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎫</span>
          <span className="text-xs text-gray-700">응모권 +{chapter.reward.tickets}장</span>
        </div>
        {chapter.reward.bonusContent && (
          <div className="flex items-center gap-2">
            <span className="text-sm">📸</span>
            <span className="text-xs text-gray-700">{chapter.reward.bonusContent}</span>
          </div>
        )}
        {chapter.reward.digitalPhotocard && (
          <div className="flex items-center gap-2">
            <span className="text-sm">✨</span>
            <span className="text-xs text-gray-700">{chapter.reward.digitalPhotocard}</span>
          </div>
        )}
      </div>

      {/* Event reward hint */}
      {chapter.number === 5 && season.isEventActive && (
        <div className="mt-2 pt-2 border-t border-violet-200/50">
          <p className="text-[10px] font-semibold text-pink-600 mb-1">🎪 이벤트 보상 (팬싸 시즌)</p>
          <p className="text-[10px] text-pink-500">팬싸 참가권 추첨 응모 자격 해금!</p>
        </div>
      )}
    </div>
  );
}
