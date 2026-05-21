// [CEB-BO-SQ-303] Quest 상세 — /sq/quests/[id]로 라우트 정합 (2026-05-21 sync 정정)
import FanQuestDetailPage from '@/app/fanquest/[id]/page';

export default function SqQuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <FanQuestDetailPage params={params} />;
}
