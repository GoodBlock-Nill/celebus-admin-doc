'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, InformationCircleIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { LangField, isAllLangsFilled, type Lang } from '@/components/clone/LangField';
import {
  getStoryQuestById,
  getGroupById,
  getEpisodeById,
  type EpisodeType,
  type EpisodeCompletedType,
} from '@/mock/sq';

const TYPE_BADGE: Record<EpisodeType, { bg: string; text: string; label: string }> = {
  FAN_QUEST: { bg: 'bg-pink-100', text: 'text-pink-700', label: '팬퀘스트' },
  PREDICTION_MARKET: { bg: 'bg-amber-100', text: 'text-amber-700', label: '예측 마켓' },
  SURVIVAL_TRIVIA: { bg: 'bg-blue-100', text: 'text-blue-700', label: '서바이벌 트리비아' },
};

const COMPLETED_TYPE_OPTIONS: Record<'PREDICTION_MARKET' | 'SURVIVAL_TRIVIA', { value: EpisodeCompletedType; label: string }[]> = {
  PREDICTION_MARKET: [
    { value: 'PM_PARTICIPATION', label: '예측 참여' },
    { value: 'PM_CORRECT', label: '예측 정답' },
  ],
  SURVIVAL_TRIVIA: [
    { value: 'TRIVIA_PARTICIPATION', label: '트리비아 참여' },
    { value: 'TRIVIA_CORRECT_COUNT', label: '트리비아 N회 정답' },
  ],
};

const MINTING_EVENT_OPTIONS = [
  { id: '', name: '민팅 이벤트 선택...' },
  { id: '23', name: 'V01D Welcome ED' },
  { id: '24', name: 'V01D Trivia Master' },
  { id: '25', name: 'V01D Final Boss' },
  { id: '26', name: 'V01D Prophet' },
  { id: '27', name: 'V01D 100 Days' },
];

export default function QuestEditPage({ params }: { params: Promise<{ id: string; qid: string }> }) {
  const { id, qid } = use(params);
  const storyId = parseInt(id, 10);
  const questId = parseInt(qid, 10);
  const story = getStoryQuestById(storyId);
  const group = story ? getGroupById(story.groupId) : undefined;
  const quest = getEpisodeById(questId);
  const router = useRouter();

  // [CEB-BO-SQ-204-EDIT] §2-2 v1.1 — 부모 에피소드 상태 + 유형별 잠금 (정책 강화: 진행중+팬퀘스트 진입 차단 / 진행중+PM/ST 다국어만 수정)
  const status = story?.status ?? 'DRAFT';
  const isFanQuest = quest?.type === 'FAN_QUEST';
  const isGameType = quest?.type === 'PREDICTION_MARKET' || quest?.type === 'SURVIVAL_TRIVIA';
  // 직접 URL 진입 방어: 진행중+팬퀘스트는 정상 흐름에서 진입 불가지만 URL 직진 시 전체 read-only
  const isFanQuestActiveBlocked = status === 'ACTIVE' && isFanQuest;
  const isAllLocked = status === 'CLOSED' || isFanQuestActiveBlocked;
  // 진행중 + PM/ST: 다국어 타이틀만 수정 가능, 나머지 모두 read-only
  const isTitleOnlyEditable = status === 'ACTIVE' && isGameType;
  // 보상 read-only: 직전 v1.0 정책 유지 + 진행중 PM/ST에서도 적용 (isTitleOnlyEditable에 포함)
  const isRewardLocked = isAllLocked || isTitleOnlyEditable;

  // [CEB-BO-SQ-204-EDIT] §2-6 v1.0 — 기존 미션 데이터 prefill
  const [titleLang, setTitleLang] = useState<Lang>('KO');
  const [title, setTitle] = useState<{ KO: string; EN: string; JA: string }>({
    KO: quest?.titleKO ?? '',
    EN: quest?.titleEN ?? '',
    JA: quest?.titleJA ?? '',
  });
  const [completedType, setCompletedType] = useState<EpisodeCompletedType | ''>(quest?.completedType ?? '');
  const [completedValue, setCompletedValue] = useState<number>(quest?.completedValue ?? 1);
  const [sourceRefName, setSourceRefName] = useState<string>(quest?.sourceRefName ?? '');
  const [rewardEntryTicket, setRewardEntryTicket] = useState<number>(quest?.rewardEntryTicket ?? 0);
  const [rewardFanPoint, setRewardFanPoint] = useState<number>(quest?.rewardFanPoint ?? 0);
  const [repeat, setRepeat] = useState<boolean>(quest?.repeat ?? false);
  const [repeatCycle, setRepeatCycle] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(
    (quest?.repeatCycle as 'DAILY' | 'WEEKLY' | 'MONTHLY' | undefined) ?? 'WEEKLY',
  );
  const [openDt, setOpenDt] = useState<string>(quest?.openDt ?? '');
  const [closeDt, setCloseDt] = useState<string>(quest?.closeDt ?? '');
  const [biveRewardYn, setBiveRewardYn] = useState<boolean>(quest?.biveRewardYn ?? false);
  const [mintingEventId, setMintingEventId] = useState<string>(quest?.mintingEventId ? String(quest.mintingEventId) : '');

  if (!story || !group || !quest) {
    return <div className="p-8 text-sm text-gray-500">미션을 찾을 수 없습니다.</div>;
  }

  const typeBadge = TYPE_BADGE[quest.type];
  const isRepeatEpisode = story.episodeKind === 'REPEAT';

  // [CEB-BO-SQ-204-EDIT] §5 v1.1 — 검증 규칙 (진행중 PM/ST는 다국어만 검증, 그 외 필드는 prefill 그대로)
  const isValid =
    !isAllLocked &&
    // PM/ST: 다국어 3종 모두 필수 ([CEB-BO-011] §5 정합)
    (isFanQuest || isAllLangsFilled(title)) &&
    // PM/ST + DRAFT: 판정 유형 + 기준값 필수 (진행중에서는 read-only이므로 prefill 유지)
    (isFanQuest || isTitleOnlyEditable || (completedType !== '' && completedValue >= 1)) &&
    // PM/ST + DRAFT: BIVE ON 시 민팅 캠페인 필수 (진행중에서는 read-only)
    (isFanQuest || isTitleOnlyEditable || !biveRewardYn || mintingEventId !== '');

  const handleCancel = () => {
    if (window.confirm('변경 사항이 사라집니다. 취소하시겠어요?')) {
      router.push(`/sq/${storyId}/quests/${questId}`);
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    alert(`[Mock] 미션 수정 완료 — '${title.KO || quest.titleKO}' (상태: ${status})`);
    router.push(`/sq/${storyId}/quests/${questId}`);
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '에피소드', href: '/sq/groups/list' },
          { label: story.titleKO, href: `/sq/${storyId}` },
          { label: `미션 ${quest.order}`, href: `/sq/${storyId}/quests/${questId}` },
          { label: '수정' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleCancel} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 max-w-[640px]">
              미션 수정 <span className="text-base font-normal text-gray-500">— {quest.titleKO}</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 mr-2">
                {group.artistGroup}
              </span>
              에피소드: {story.titleKO}
            </p>
          </div>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
          {typeBadge.label}
        </span>
      </div>

      {/* [CEB-BO-SQ-204-EDIT] §2-2 v1.1 — 상태 배너 (종료 / 진행중+팬퀘스트 차단 방어 / 진행중+PM/ST) */}
      {status === 'CLOSED' && (
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-6 flex items-start gap-3">
          <LockClosedIcon className="w-5 h-5 text-gray-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">종료된 에피소드의 미션</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              종료된 에피소드의 미션은 수정할 수 없습니다. 모든 필드가 read-only이며 [저장] 버튼이 비활성화됩니다.
              (정상 흐름에서는 미션 상세의 [수정하기] 버튼이 비활성화되어 본 화면에 진입할 수 없습니다.)
            </p>
          </div>
        </div>
      )}
      {isFanQuestActiveBlocked && (
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-6 flex items-start gap-3">
          <LockClosedIcon className="w-5 h-5 text-gray-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">팬퀘스트 유형 미션은 진행중 상태에서 수정할 수 없습니다</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              본 화면은 직접 URL 진입을 통한 방어 표시이며 모든 필드가 read-only입니다.
              정상 흐름에서는 미션 상세의 [수정하기] 버튼이 비활성화되어 본 화면에 진입할 수 없습니다.
            </p>
          </div>
        </div>
      )}
      {isTitleOnlyEditable && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-0.5">진행중 에피소드의 미션</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              회원 기대권 보호를 위해 <strong>다국어 타이틀(KO·EN·JA)만 수정 가능</strong>합니다.
              판정 유형·보상·반복 설정은 모두 read-only입니다.
            </p>
          </div>
        </div>
      )}

      {/* [CEB-BO-SQ-204-EDIT] §2-3 v1.0 — 팬퀘스트 메타 안내 박스 (FAN_QUEST 한정) */}
      {isFanQuest && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-900 mb-0.5">이 미션은 팬퀘스트 자체 데이터를 상속받습니다</p>
            <ul className="text-xs text-indigo-800 leading-relaxed mt-1 list-disc list-inside space-y-0.5">
              <li>타이틀·다국어 타이틀·이미지·보상은 <strong>팬퀘스트 영역</strong>에서만 수정 가능합니다.</li>
              <li>본 화면에서는 <strong>BIVE 토글·민팅 캠페인</strong> 등 미션 고유 메타만 수정할 수 있습니다.</li>
              <li>팬퀘스트 매핑(#{quest.fanQuestId}) 자체는 본 화면에서 변경할 수 없습니다 (재매핑은 미션 삭제 후 재생성).</li>
            </ul>
          </div>
        </div>
      )}

      {/* 섹션 1 — 기본 정보 (모두 read-only) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-base font-semibold text-gray-900 mb-4">기본 정보</h4>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">표시 순서 <span className="text-[11px] text-gray-400 font-normal">(읽기 전용)</span></label>
            <div className="h-11 px-3 inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono">
              #{quest.order} / 10
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">유형 <span className="text-[11px] text-gray-400 font-normal">(읽기 전용 — 변경 필요 시 삭제 후 재생성)</span></label>
            <div className={`h-11 px-3 inline-flex items-center rounded-lg text-sm font-medium ${typeBadge.bg} ${typeBadge.text}`}>
              {typeBadge.label}
            </div>
          </div>
        </div>
      </div>

      {/* [CEB-BO-SQ-204-EDIT] §2-6 v1.0 — PM/ST 다국어 타이틀 (KO·EN·JA 3종 모두 필수) */}
      {isGameType && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h4 className="text-base font-semibold text-gray-900 mb-1">다국어 타이틀</h4>
          <p className="text-[11px] text-gray-500 mb-4">
            PM/ST 미션은 <strong>KO/EN/JA 3개 언어 모두 필수</strong>입니다 ([CEB-BO-011] §5 다국어 필수 정합).
            {isAllLocked && <span className="text-gray-700 font-medium ml-1">· 종료 상태에서는 수정할 수 없습니다.</span>}
          </p>
          {isAllLocked ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500 shrink-0">한국어 (KO)</span>
                <span className="text-gray-900 text-right">{title.KO || '—'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500 shrink-0">영어 (EN)</span>
                <span className="text-gray-900 text-right">{title.EN || '—'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500 shrink-0">일본어 (JA)</span>
                <span className="text-gray-900 text-right">{title.JA || '—'}</span>
              </div>
            </div>
          ) : (
            <LangField
              label="타이틀"
              required
              lang={titleLang}
              onLangChange={setTitleLang}
              value={title[titleLang]}
              onChange={(v) => setTitle({ ...title, [titleLang]: v })}
              placeholder="미션 타이틀을 입력하세요"
              maxLength={50}
              values={title}
            />
          )}
        </div>
      )}

      {/* 섹션 2 — PM/ST 판정 유형 */}
      {isGameType && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h4 className="text-base font-semibold text-gray-900 mb-4">판정 유형</h4>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">판정 유형 <span className="text-red-500">*</span></label>
              <select
                value={completedType}
                onChange={(e) => setCompletedType(e.target.value as EpisodeCompletedType)}
                disabled={isAllLocked || isTitleOnlyEditable}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">판정 유형 선택...</option>
                {COMPLETED_TYPE_OPTIONS[quest.type as 'PREDICTION_MARKET' | 'SURVIVAL_TRIVIA'].map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                기준 횟수 <span className="text-red-500">*</span>
                <span className="text-[11px] text-gray-400 font-normal ml-1">(N회 이상)</span>
              </label>
              <input
                type="number"
                min={1}
                value={completedValue}
                onChange={(e) => setCompletedValue(Math.max(1, parseInt(e.target.value || '1', 10)))}
                disabled={isAllLocked || isTitleOnlyEditable}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">소스 참조값 <span className="text-[11px] text-gray-400 font-normal">(선택)</span></label>
            <input
              type="text"
              value={sourceRefName}
              onChange={(e) => setSourceRefName(e.target.value)}
              disabled={isAllLocked || isTitleOnlyEditable}
              placeholder="예: 예측 마켓 #34 — 다음 컴백 시점"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      )}

      {/* 섹션 3 — 보상 (PM/ST 전용 · 진행중·종료 시 read-only) */}
      {isGameType && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-base font-semibold text-gray-900">보상 설정</h4>
            {isRewardLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                <LockClosedIcon className="w-3 h-3" />
                {isAllLocked ? '종료 read-only' : '진행중 read-only'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">응모권 (장) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                value={rewardEntryTicket}
                onChange={(e) => setRewardEntryTicket(parseInt(e.target.value || '0', 10))}
                disabled={isRewardLocked}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">덕력 (DUK) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                value={rewardFanPoint}
                onChange={(e) => setRewardFanPoint(parseInt(e.target.value || '0', 10))}
                disabled={isRewardLocked}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          {/* 반복 여부·주기·기간 (반복 에피소드 한정) */}
          {isRepeatEpisode && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-900">반복 여부 <span className="text-[11px] text-gray-400 font-normal ml-1">(반복 에피소드 전용)</span></label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repeat}
                    onChange={(e) => setRepeat(e.target.checked)}
                    disabled={isAllLocked || isTitleOnlyEditable}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-disabled:opacity-50" />
                  <span className="ml-2 text-sm text-gray-700">{repeat ? '반복' : '단일'}</span>
                </label>
              </div>

              {repeat && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mb-3">반복 주기와 운영 기간을 설정하세요. 시작·종료일을 비우면 그룹 기간을 상속합니다.</p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">반복 주기 <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => setRepeatCycle(cycle)}
                          disabled={isAllLocked || isTitleOnlyEditable}
                          className={`h-10 px-4 text-sm font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            repeatCycle === cycle
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {cycle === 'DAILY' ? '일간' : cycle === 'WEEKLY' ? '주간' : '월간'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">시작일자</label>
                      <input
                        type="datetime-local"
                        value={openDt}
                        onChange={(e) => setOpenDt(e.target.value)}
                        disabled={isAllLocked || isTitleOnlyEditable}
                        className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">비우면 그룹 시작일 상속</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">종료일자</label>
                      <input
                        type="datetime-local"
                        value={closeDt}
                        onChange={(e) => setCloseDt(e.target.value)}
                        disabled={isAllLocked || isTitleOnlyEditable}
                        className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">비우면 그룹 종료일 상속. 그룹 기간 안에서만 허용</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 섹션 4 — BIVE 보상 (PM/ST + FAN_QUEST 공통 · 진행중·종료 시 read-only) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-gray-900">BIVE 보상</h4>
            {isRewardLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                <LockClosedIcon className="w-3 h-3" />
                {isAllLocked ? '종료 read-only' : '진행중 read-only'}
              </span>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={biveRewardYn}
              onChange={(e) => setBiveRewardYn(e.target.checked)}
              disabled={isRewardLocked}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 peer-disabled:opacity-50" />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {biveRewardYn ? <span className="text-indigo-700">ON</span> : 'OFF'}
            </span>
          </label>
        </div>
        {biveRewardYn ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              민팅 이벤트 <span className="text-red-500">*</span>
            </label>
            <select
              value={mintingEventId}
              onChange={(e) => setMintingEventId(e.target.value)}
              disabled={isRewardLocked}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50 disabled:text-gray-500"
            >
              {MINTING_EVENT_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-gray-500 leading-relaxed">
            BIVE 보상이 OFF 상태입니다. 본 미션 완료 시 BIVE NFT 민팅이 발생하지 않습니다.
          </p>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-2">
        <button
          onClick={handleCancel}
          className="h-10 px-5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
        >
          취소하기
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          저장
        </button>
      </div>
    </div>
  );
}
