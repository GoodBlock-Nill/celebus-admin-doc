// 일일미션(DLY) — BO 관리 (미션 풀 + 하루 제시 수)
// 덕력 지급량은 본 영역에서 설정하지 않음 — [CEB-BO-ART-401-POLICY] 덕력 지급 정책 단일 기준(선택 아티스트 귀속).
// 근거: [CEB-FQ-501] 일일 미션 앱 명세 + [CEB-000] §5.2·§5.2.2·§6 데일리 루프
// 프로토타입 100% mock. 새로고침 시 초기값 복귀.

export interface DailyMission {
  id: number;
  labelKO: string; // 미션명 (한국어)
  labelEN: string;
  labelJA: string;
  descKO: string; // 설명 (선택)
  descEN: string;
  descJA: string;
  targetScreen: string; // 이동 대상 앱 화면 ID (딥링크)
  active: boolean; // 사용여부 (미사용 시 미션 풀에서 제외)
}

// 이동 대상 후보 — [CEB-FQ-501] 미션 풀 8종의 이동 대상 앱 화면
// comingSoon: 앱 미오픈(준비 중) 대상. 미션 등록은 가능하나 노출 전까지 미션 선택에서 자동 제외.
//   실제 가용성은 운영 데이터 기준이며, 아래 플래그는 프로토타입 시연용 예시값이다.
export interface MissionTarget {
  id: string;
  label: string;
  comingSoon?: boolean;
}

export const MISSION_TARGETS: MissionTarget[] = [
  { id: 'CEB-ART-101', label: '아티스트 메인' },
  { id: 'CEB-GAM-101', label: '게임존 메인' },
  { id: 'CEB-MEM-101', label: '기억저장소' },
  { id: 'CEB-DUK-101', label: '덕력 랭킹' },
  { id: 'CEB-EVT-101', label: '래플 리스트' },
  { id: 'CEB-COL-101', label: '컬렉션 메인', comingSoon: true }, // 예시: 준비 중
  { id: 'CEB-DUK-201', label: '서포트 이벤트' },
  { id: 'CEB-INF-101', label: '정보 피드' },
];

export const targetLabel = (id: string) => MISSION_TARGETS.find((t) => t.id === id)?.label ?? id;
export const isTargetComingSoon = (id: string) => MISSION_TARGETS.find((t) => t.id === id)?.comingSoon ?? false;

// 일일미션 설정값 — 덕력 보상값은 지급 정책 소관(여기서 설정하지 않음)
export interface DailySettings {
  dailyCount: number; // 하루 제시 수 (현 2건)
}

// 스트릭 마일스톤 — 연속 일수만 정책 고정(읽기 전용 안내). 보너스 덕력 지급량은 지급 정책 소관.
export interface StreakMilestone {
  days: number; // 연속 일수 (정책 고정: 7/14/21/28, 28일 주기마다 순환·반복)
}

// 미션 풀 8종 (페이지 방문형) — 완료 조건 "1회 진입"
export const dailyMissions: DailyMission[] = [
  { id: 1, labelKO: '아티스트 페이지 방문', labelEN: 'Visit artist page', labelJA: 'アーティストページ訪問', descKO: '아티스트 페이지에 방문해요', descEN: 'Visit the artist page', descJA: 'アーティストページを訪問', targetScreen: 'CEB-ART-101', active: true },
  { id: 2, labelKO: '게임존 방문', labelEN: 'Visit Game Zone', labelJA: 'ゲームゾーン訪問', descKO: '게임존을 둘러봐요', descEN: 'Explore the Game Zone', descJA: 'ゲームゾーンを見る', targetScreen: 'CEB-GAM-101', active: true },
  { id: 3, labelKO: '기억저장소 방문', labelEN: 'Visit Memories', labelJA: '思い出訪問', descKO: '기억저장소를 둘러봐요', descEN: 'Browse memories', descJA: '思い出を見る', targetScreen: 'CEB-MEM-101', active: true },
  { id: 4, labelKO: '덕력 랭킹 확인', labelEN: 'Check ranking', labelJA: 'ランキング確認', descKO: '덕력 랭킹을 확인해요', descEN: 'Check the Fan Power ranking', descJA: '推し力ランキングを確認', targetScreen: 'CEB-DUK-101', active: true },
  { id: 5, labelKO: '래플 확인', labelEN: 'Check raffles', labelJA: 'ラッフル確認', descKO: '진행 중인 래플을 확인해요', descEN: 'Check ongoing raffles', descJA: '開催中のラッフルを確認', targetScreen: 'CEB-EVT-101', active: true },
  { id: 6, labelKO: '컬렉션 확인', labelEN: 'Check collection', labelJA: 'コレクション確認', descKO: '내 컬렉션을 확인해요', descEN: 'Check your collection', descJA: 'コレクションを確認', targetScreen: 'CEB-COL-101', active: true },
  { id: 7, labelKO: '서포트 이벤트 확인', labelEN: 'Check support events', labelJA: 'サポート確認', descKO: '서포트 이벤트를 확인해요', descEN: 'Check support events', descJA: 'サポートイベントを確認', targetScreen: 'CEB-DUK-201', active: true },
  { id: 8, labelKO: '아티스트 정보 확인', labelEN: 'Check artist info', labelJA: 'アーティスト情報', descKO: '아티스트 소식·일정을 확인해요', descEN: 'Check artist news', descJA: 'アーティスト情報を確認', targetScreen: 'CEB-INF-101', active: true },
];

export const dailySettings: DailySettings = {
  dailyCount: 2,
};

// 스트릭 마일스톤 — 7/14/21/28일 정책 고정, 28일 주기(4주)마다 순환·반복. 보너스 덕력 지급량은 지급 정책 소관.
export const streakMilestones: StreakMilestone[] = [
  { days: 7 },
  { days: 14 },
  { days: 21 },
  { days: 28 },
];
