// 앱 운영 — 알림(APP-3xx) v1.3 SSOT
// [CEB-BO-013] / [CEB-BO-APP-301~303] 정합
//
// 수동 알림 (Notification):
//   - 운영자가 캠페인성으로 작성·예약·발송하는 1회성 메시지
//   - 6종 상태 (DRAFT/SCHEDULED/SENDING/SENT/PARTIAL_FAILED/FAILED)
//   - 대상: 전역 / 아티스트 팬덤 / 회원 그룹
//
// 자동 트리거 정책 (TriggerPolicy):
//   - 시스템 이벤트 발생 시 백엔드가 자동 발송하는 정책 카탈로그
//   - 운영자는 조회만 가능. 신규 등록·메시지 수정·활성 변경 모두 백오피스 불가 (개발팀 요청 채널)
//   - 운영자에게 노출되는 상태는 "사용중 / 미사용" 2종만 (발송 인스턴스 단위 SENT/FAILED는 백엔드 내부 상태)
//
// 채널 공통: 기본알림(인앱 알림센터) + 푸시알림(Web Push · PWA · iOS는 홈 화면 추가된 회원만)

// 수동 알림 상태 (6종)
export type ManualNotiStatus =
  | 'DRAFT'           // 임시저장
  | 'SCHEDULED'       // 예약
  | 'SENDING'         // 발송중
  | 'SENT'            // 발송 완료
  | 'PARTIAL_FAILED'  // 부분 실패
  | 'FAILED';         // 실패

// (호환) 기존 통합 타입 — 수동 알림 전용
export type NotiStatus = ManualNotiStatus;

export type NotiTargetType = 'GLOBAL' | 'ARTIST_FANDOM' | 'MEMBER_GROUP';
export type NotiChannel = 'BASIC_ONLY' | 'BASIC_PUSH';
export type NotiScheduleType = 'IMMEDIATE' | 'SCHEDULED' | 'DRAFT';

export type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS' | 'MADEIN' | 'UNDER:LIGHT';

export interface I18nText {
  ko: string;
  en: string;
  jp: string;
}

// 수동 알림 인스턴스
export interface Notification {
  id: string;
  title: I18nText;
  body: I18nText;
  pushShort?: I18nText;
  status: NotiStatus;
  channel: NotiChannel;
  targetType: NotiTargetType;
  targetArtist?: ArtistGroup;      // ARTIST_FANDOM일 때
  targetMemberCount?: number;       // MEMBER_GROUP일 때
  scheduleType: NotiScheduleType;
  sendAt?: string;                  // 발송 시각 또는 예약 시각
  reachCount?: number;              // 도달 회원 수
  failCount?: number;               // 실패 수
  pushOffCount?: number;            // 푸시 권한 OFF 수
  deeplinkLabel?: string;            // URL (빈 값 = 본문 클릭 비활성)
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export const ACTIVE_ARTISTS: ArtistGroup[] = ['V01D', 'iKON', 'CELEBUS', 'MADEIN', 'UNDER:LIGHT'];

// 상태 메타
interface StatusMeta {
  label: string;
  badge: string; // tailwind classes
}

export const NOTI_STATUS_META: Record<NotiStatus, StatusMeta> = {
  DRAFT: { label: '임시저장', badge: 'bg-gray-100 text-gray-700' },
  SCHEDULED: { label: '예약', badge: 'bg-indigo-100 text-indigo-700' },
  SENDING: { label: '발송중', badge: 'bg-amber-100 text-amber-700' },
  SENT: { label: '발송 완료', badge: 'bg-emerald-100 text-emerald-700' },
  PARTIAL_FAILED: { label: '부분 실패', badge: 'bg-orange-100 text-orange-700' },
  FAILED: { label: '실패', badge: 'bg-rose-100 text-rose-700' },
};

export function getStatusMeta(s: NotiStatus): StatusMeta {
  return NOTI_STATUS_META[s];
}

export function getChannelLabel(c: NotiChannel): string {
  return c === 'BASIC_PUSH' ? '기본 + 푸시' : '기본';
}

export function getTargetLabel(n: Notification): string {
  if (n.targetType === 'GLOBAL') return '전역';
  if (n.targetType === 'ARTIST_FANDOM') return `팬덤 · ${n.targetArtist}`;
  return `회원 그룹 · ${n.targetMemberCount ?? 0}명`;
}

export function getSendTimingLabel(n: Notification): string {
  if (n.scheduleType === 'DRAFT') return '—';
  if (n.scheduleType === 'SCHEDULED') return `예약 · ${n.sendAt ?? '—'}`;
  return n.sendAt ?? '—';
}

// ---- 수동 알림 Mock (10건) ----
export const NOTIFICATIONS: Notification[] = [
  {
    id: 'NOTI-001',
    title: { ko: '[V01D] 컴백 안내', en: '[V01D] Comeback Announcement', jp: '[V01D] カムバック告知' },
    body: {
      ko: 'V01D 신규 미니앨범 발매를 알려드립니다. 응모하기에서 한정판 굿즈를 만나보세요.',
      en: 'V01D releases a new mini album. Join the raffle for limited goods.',
      jp: 'V01Dの新ミニアルバム発売をお知らせします。応募で限定グッズをゲットしよう。',
    },
    pushShort: { ko: 'V01D 컴백 안내 🎉', en: 'V01D is back 🎉', jp: 'V01D カムバック 🎉' },
    status: 'SENT',
    channel: 'BASIC_PUSH',
    targetType: 'ARTIST_FANDOM',
    targetArtist: 'V01D',
    scheduleType: 'IMMEDIATE',
    sendAt: '2026.05.18 14:30',
    reachCount: 24812,
    failCount: 12,
    pushOffCount: 1024,
    deeplinkLabel: 'V01D 아티스트 홈',
    createdAt: '2026.05.18 14:25',
    updatedAt: '2026.05.18 14:30',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-002',
    title: { ko: '서비스 점검 안내', en: 'Service Maintenance', jp: 'サービスメンテナンスのお知らせ' },
    body: {
      ko: '5월 20일 03:00~05:00 정기 점검이 진행됩니다. 점검 시간 동안 서비스 이용이 제한됩니다.',
      en: 'Scheduled maintenance on May 20, 03:00–05:00. Service will be temporarily unavailable.',
      jp: '5月20日 03:00〜05:00に定期メンテナンスを実施します。',
    },
    status: 'SCHEDULED',
    channel: 'BASIC_PUSH',
    targetType: 'GLOBAL',
    scheduleType: 'SCHEDULED',
    sendAt: '2026.05.19 22:00',
    createdAt: '2026.05.19 11:00',
    updatedAt: '2026.05.19 11:05',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-004',
    title: { ko: '오늘의 미션', en: "Today's Mission", jp: '本日のミッション' },
    body: {
      ko: '오늘의 할일 3개를 완료하고 응모권을 받아보세요!',
      en: 'Complete 3 daily tasks to receive raffle tickets!',
      jp: '本日のミッション3つをクリアして応募券をゲット!',
    },
    status: 'SENDING',
    channel: 'BASIC_PUSH',
    targetType: 'GLOBAL',
    scheduleType: 'IMMEDIATE',
    sendAt: '2026.05.19 09:00',
    reachCount: 12404,
    failCount: 0,
    pushOffCount: 850,
    createdAt: '2026.05.19 08:55',
    updatedAt: '2026.05.19 09:00',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-005',
    title: { ko: '[iKON] 새 소식', en: '[iKON] New Story', jp: '[iKON] 新着ニュース' },
    body: {
      ko: 'iKON의 새 소식이 도착했어요. 정보 피드에서 확인해 주세요.',
      en: 'A new story from iKON has arrived. Check the news feed.',
      jp: 'iKONの新着情報が届きました。',
    },
    status: 'PARTIAL_FAILED',
    channel: 'BASIC_PUSH',
    targetType: 'ARTIST_FANDOM',
    targetArtist: 'iKON',
    scheduleType: 'IMMEDIATE',
    sendAt: '2026.05.18 18:00',
    reachCount: 18230,
    failCount: 312,
    pushOffCount: 720,
    deeplinkLabel: '소식 #2104',
    createdAt: '2026.05.18 17:55',
    updatedAt: '2026.05.18 18:00',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-006',
    title: {
      ko: '[BIVE] V01D Genesis 컬렉션 민팅 D-1',
      en: '[BIVE] V01D Genesis Collection Minting D-1',
      jp: '[BIVE] V01D Genesisコレクション ミンティング D-1',
    },
    body: {
      ko: '내일 21:00, V01D Genesis 컬렉션 민팅이 시작됩니다. 보유 응원권으로 우선 민팅 기회를 놓치지 마세요.',
      en: 'V01D Genesis minting starts tomorrow at 21:00. Use your cheer tickets for priority access.',
      jp: '明日21:00、V01D Genesisミンティング開始。',
    },
    pushShort: { ko: 'V01D Genesis 민팅 D-1 ⏰', en: 'V01D Genesis D-1 ⏰', jp: 'V01D Genesis D-1 ⏰' },
    status: 'SENT',
    channel: 'BASIC_PUSH',
    targetType: 'ARTIST_FANDOM',
    targetArtist: 'V01D',
    scheduleType: 'IMMEDIATE',
    sendAt: '2026.05.18 20:00',
    reachCount: 24812,
    failCount: 28,
    pushOffCount: 1102,
    deeplinkLabel: 'V01D Genesis 컬렉션',
    createdAt: '2026.05.18 19:50',
    updatedAt: '2026.05.18 20:00',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-008',
    title: { ko: '[CELEBUS] 팬미팅 사전 예약 안내', en: '[CELEBUS] Fanmeeting pre-booking', jp: '[CELEBUS] ファンミ事前予約' },
    body: { ko: 'CELEBUS 팬미팅 사전 예약이 곧 시작됩니다.', en: 'Pre-booking starts soon.', jp: '事前予約間もなく開始。' },
    status: 'DRAFT',
    channel: 'BASIC_PUSH',
    targetType: 'ARTIST_FANDOM',
    targetArtist: 'CELEBUS',
    scheduleType: 'DRAFT',
    createdAt: '2026.05.19 13:00',
    updatedAt: '2026.05.19 13:10',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-009',
    title: {
      ko: '[응모권 만료 임박] 5월 마지막 주 안내',
      en: '[Tickets Expiring] Last Week of May',
      jp: '[応募券期限] 5月最終週のお知らせ',
    },
    body: {
      ko: '5월 31일까지 만료 예정인 응모권이 있으신지 확인해 보세요. 마지막 응모 기회를 놓치지 마세요!',
      en: 'Check if you have tickets expiring by May 31. Use them before they expire!',
      jp: '5月31日までに期限切れの応募券をご確認ください。',
    },
    status: 'SCHEDULED',
    channel: 'BASIC_PUSH',
    targetType: 'GLOBAL',
    scheduleType: 'SCHEDULED',
    sendAt: '2026.05.24 10:00',
    deeplinkLabel: '응모권 보관함',
    createdAt: '2026.05.19 09:00',
    updatedAt: '2026.05.19 11:30',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-010',
    title: { ko: '[MADEIN] 새 응원하기 이벤트', en: '[MADEIN] New cheer event', jp: '[MADEIN] 新応援イベント' },
    body: { ko: 'MADEIN 응원하기 이벤트가 시작되었습니다.', en: 'A new cheer event has begun.', jp: '新しい応援イベントが始まりました。' },
    status: 'SENT',
    channel: 'BASIC_ONLY',
    targetType: 'ARTIST_FANDOM',
    targetArtist: 'MADEIN',
    scheduleType: 'IMMEDIATE',
    sendAt: '2026.05.17 11:00',
    reachCount: 9340,
    failCount: 0,
    deeplinkLabel: '서포트 이벤트 #88',
    createdAt: '2026.05.17 10:55',
    updatedAt: '2026.05.17 11:00',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-011',
    title: { ko: '약관 개정 사전 안내', en: 'Terms Update Notice', jp: '約款改定のお知らせ' },
    body: { ko: '5월 25일부터 적용되는 약관 개정 사전 안내입니다.', en: 'Terms update effective May 25.', jp: '5月25日施行の約款改定。' },
    status: 'FAILED',
    channel: 'BASIC_PUSH',
    targetType: 'GLOBAL',
    scheduleType: 'IMMEDIATE',
    sendAt: '2026.05.18 22:00',
    reachCount: 0,
    failCount: 245000,
    pushOffCount: 0,
    createdAt: '2026.05.18 21:55',
    updatedAt: '2026.05.18 22:01',
    updatedBy: 'nill',
  },
  {
    id: 'NOTI-012',
    title: { ko: '[UNDER:LIGHT] 컴백 D-3', en: '[UNDER:LIGHT] Comeback D-3', jp: '[UNDER:LIGHT] カムバックD-3' },
    body: { ko: 'UNDER:LIGHT 컴백 D-3 카운트다운이 시작되었습니다.', en: 'Comeback D-3 countdown begins.', jp: 'カムバックD-3カウントダウン開始。' },
    status: 'SENT',
    channel: 'BASIC_PUSH',
    targetType: 'ARTIST_FANDOM',
    targetArtist: 'UNDER:LIGHT',
    scheduleType: 'IMMEDIATE',
    sendAt: '2026.05.16 09:00',
    reachCount: 14210,
    failCount: 8,
    pushOffCount: 610,
    createdAt: '2026.05.16 08:55',
    updatedAt: '2026.05.16 09:00',
    updatedBy: 'nill',
  },
];

export function getNotificationById(id: string): Notification | undefined {
  return NOTIFICATIONS.find((n) => n.id === id);
}

// 수동 알림 통계 (4종 카드 + 부속 실패 카운트)
export function getManualStats() {
  const list = NOTIFICATIONS;
  return {
    total: list.length,
    draft: list.filter((n) => n.status === 'DRAFT').length,
    scheduled: list.filter((n) => n.status === 'SCHEDULED').length,
    sent: list.filter((n) => n.status === 'SENT').length,
    failed: list.filter((n) => n.status === 'FAILED' || n.status === 'PARTIAL_FAILED').length,
  };
}

// ---- 자동 트리거 정책 카탈로그 (조회 전용) ----
// 운영자는 신규 등록·메시지 수정·활성 변경 모두 불가. 변경은 개발팀 요청 채널.
// 백오피스에서 노출되는 상태는 "사용중 / 미사용" 2종만 (active boolean).

export type TriggerCategory =
  | 'RAFFLE'
  | 'SQ_QUEST'
  | 'BIVE'
  | 'MEMBER_ACTIVITY'
  | 'SYSTEM_NOTICE';

export const TRIGGER_CATEGORY_LABEL: Record<TriggerCategory, string> = {
  RAFFLE: '래플',
  SQ_QUEST: '응원하기 · 퀘스트',
  BIVE: 'BIVE',
  MEMBER_ACTIVITY: '회원 활동',
  SYSTEM_NOTICE: '시스템 공지',
};

export interface TriggerPolicy {
  id: string;
  name: string;
  category: TriggerCategory;
  triggerCondition: string;       // 트리거 조건 자유 텍스트
  active: boolean;                 // 사용중(true) / 미사용(false)
  channel: NotiChannel;
  title: I18nText;
  body: I18nText;
  pushShort?: I18nText;
  deeplinkLabel?: string;
  lastFiredAt?: string;            // 최근 발송 시각 (참고용)
}

export const TRIGGER_POLICIES: TriggerPolicy[] = [
  {
    id: 'TRG-001',
    name: '래플 · 당첨자 결정',
    category: 'RAFFLE',
    triggerCondition: '회원이 응모한 래플의 당첨자가 결정될 때 당첨자 본인에게 즉시 발송',
    active: true,
    channel: 'BASIC_PUSH',
    title: { ko: '래플 당첨을 축하합니다!', en: 'Congrats on winning the raffle!', jp: 'ラッフル当選おめでとうございます!' },
    body: {
      ko: '"{래플명}" 응모에 당첨되셨습니다. 응모권 보관함에서 확인해 주세요.',
      en: 'You won "{raffle}". Check your ticket inbox.',
      jp: '"{raffle}"に当選しました。',
    },
    pushShort: { ko: '래플 당첨 🎁', en: 'Raffle won 🎁', jp: 'ラッフル当選 🎁' },
    deeplinkLabel: '래플 상세 (트리거 컨텍스트 자동)',
    lastFiredAt: '2026.05.19 12:00',
  },
  {
    id: 'TRG-002',
    name: '래플 · 추첨 종료 미당첨자',
    category: 'RAFFLE',
    triggerCondition: '래플 추첨이 종료되어 미당첨자가 확정될 때 응모자 본인에게 발송',
    active: true,
    channel: 'BASIC_ONLY',
    title: { ko: '래플 추첨 결과 안내', en: 'Raffle Result', jp: '抽選結果のお知らせ' },
    body: {
      ko: '"{래플명}" 응모 결과를 확인해 주세요. 다음 기회에 또 만나요!',
      en: 'Check the result of "{raffle}".',
      jp: '"{raffle}"の結果をご確認ください。',
    },
    deeplinkLabel: '래플 상세 (트리거 컨텍스트 자동)',
    lastFiredAt: '2026.05.18 21:00',
  },
  {
    id: 'TRG-003',
    name: '퀘스트 · 제출 승인',
    category: 'SQ_QUEST',
    triggerCondition: '운영자가 회원의 퀘스트 제출을 승인할 때 제출자 본인에게 즉시 발송',
    active: true,
    channel: 'BASIC_PUSH',
    title: { ko: '퀘스트 제출 승인', en: 'Quest Submission Approved', jp: 'クエスト提出承認' },
    body: {
      ko: '"{퀘스트명}" 제출이 승인되었습니다. 보상을 확인해 주세요.',
      en: 'Your submission of "{quest}" has been approved.',
      jp: '"{quest}"が承認されました。',
    },
    deeplinkLabel: '응모권 보관함',
    lastFiredAt: '2026.05.19 10:12',
  },
  {
    id: 'TRG-004',
    name: '퀘스트 · 제출 반려',
    category: 'SQ_QUEST',
    triggerCondition: '운영자가 회원의 퀘스트 제출을 반려할 때 제출자 본인에게 즉시 발송. 반려 사유 포함',
    active: true,
    channel: 'BASIC_PUSH',
    title: { ko: '퀘스트 제출 반려 안내', en: 'Quest Submission Rejected', jp: 'クエスト提出却下' },
    body: {
      ko: '"{퀘스트명}" 제출이 반려되었습니다. 사유: {반려사유}',
      en: 'Your submission of "{quest}" was rejected. Reason: {reason}',
      jp: '"{quest}"が却下されました。理由: {reason}',
    },
    deeplinkLabel: '퀘스트 제출 화면',
    lastFiredAt: '2026.05.19 11:05',
  },
  {
    id: 'TRG-005',
    name: 'BIVE · 구매 완료',
    category: 'BIVE',
    triggerCondition: '회원의 BIVE 구매 트랜잭션이 완료될 때 구매자 본인에게 즉시 발송',
    active: true,
    channel: 'BASIC_PUSH',
    title: { ko: 'BIVE 구매 완료', en: 'BIVE Purchase Complete', jp: 'BIVE購入完了' },
    body: {
      ko: '"{에디션명}" 구매가 완료되었습니다. 컬렉션에서 확인해 주세요.',
      en: 'Your purchase of "{edition}" is complete.',
      jp: '"{edition}"の購入が完了しました。',
    },
    pushShort: { ko: 'BIVE 구매 완료 ✅', en: 'BIVE purchased ✅', jp: 'BIVE購入完了 ✅' },
    deeplinkLabel: '내 컬렉션 (트리거 컨텍스트 자동)',
    lastFiredAt: '2026.05.19 13:42',
  },
  {
    id: 'TRG-006',
    name: 'BIVE · 민팅 시작',
    category: 'BIVE',
    triggerCondition: 'BIVE 컬렉션 민팅이 실제로 시작될 때 해당 컬렉션 구매 자격이 있는 회원에게 발송',
    active: true,
    channel: 'BASIC_PUSH',
    title: { ko: 'BIVE 민팅 시작', en: 'BIVE Minting Started', jp: 'BIVEミンティング開始' },
    body: {
      ko: '"{컬렉션명}" 민팅이 지금 시작되었습니다. 보유 응원권으로 우선 민팅하세요.',
      en: 'Minting of "{collection}" has started. Use your cheer tickets for priority access.',
      jp: '"{collection}"のミンティングが開始されました。',
    },
    pushShort: { ko: 'BIVE 민팅 시작 🚀', en: 'BIVE Minting LIVE 🚀', jp: 'BIVE LIVE 🚀' },
    deeplinkLabel: 'BIVE 민팅 화면',
    lastFiredAt: '2026.05.17 21:00',
  },
  {
    id: 'TRG-007',
    name: '회원 · 가입 환영',
    category: 'MEMBER_ACTIVITY',
    triggerCondition: '회원 가입이 완료될 때 신규 회원에게 즉시 발송',
    active: true,
    channel: 'BASIC_PUSH',
    title: { ko: 'CELEBUS에 오신 것을 환영합니다!', en: 'Welcome to CELEBUS!', jp: 'CELEBUSへようこそ!' },
    body: {
      ko: '가입을 환영합니다. 첫 응모하기를 통해 응모권을 받아보세요.',
      en: 'Welcome! Join your first raffle to earn tickets.',
      jp: 'ご登録ありがとうございます。',
    },
    pushShort: { ko: '환영합니다 🎉', en: 'Welcome 🎉', jp: 'ようこそ 🎉' },
    deeplinkLabel: '신규 가입 환영 페이지',
    lastFiredAt: '2026.05.19 14:18',
  },
  {
    id: 'TRG-008',
    name: '시스템 · 점검 사전 공지',
    category: 'SYSTEM_NOTICE',
    triggerCondition: '예정된 시스템 점검 24시간 전에 전체 회원에게 자동 공지',
    active: false,
    channel: 'BASIC_PUSH',
    title: { ko: '서비스 점검 안내', en: 'Service Maintenance', jp: 'サービスメンテナンス' },
    body: {
      ko: '{점검시작}~{점검종료} 정기 점검이 진행됩니다. 점검 시간 동안 서비스 이용이 제한됩니다.',
      en: 'Maintenance from {start} to {end}.',
      jp: '{start}〜{end}にメンテナンスを実施します。',
    },
    deeplinkLabel: '점검 공지 페이지',
  },
];

export function getTriggerPolicyById(id: string): TriggerPolicy | undefined {
  return TRIGGER_POLICIES.find((p) => p.id === id);
}

