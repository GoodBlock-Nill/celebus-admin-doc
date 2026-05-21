// [CEB-BO-SQ-302-CREATE] Quest 생성 — /sq/quests/create로 라우트 정합 (2026-05-21 sync 정정)
// 현재는 기존 fanquest 페이지 구현체를 그대로 사용 (점진 마이그레이션)
import FanQuestCreatePage from '@/app/fanquest/create/page';

export default function SqQuestCreatePage() {
  return <FanQuestCreatePage />;
}
