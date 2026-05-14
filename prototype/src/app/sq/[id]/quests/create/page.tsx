'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import {
  getStoryQuestById,
  getGroupById,
  getEpisodesByStoryId,
  getFanQuestsByArtist,
  getRepeatFanQuestsByArtist,
  GAME_CONDITION_LABEL,
  MAX_EPISODES_PER_STORY,
  type EpisodeType,
  type GameCondition,
} from '@/mock/sq';

const TYPE_OPTIONS: { value: EpisodeType; label: string; bg: string; text: string }[] = [
  { value: 'FAN_QUEST', label: 'FAN_QUEST', bg: 'bg-pink-100', text: 'text-pink-700' },
  { value: 'PREDICTION_MARKET', label: 'PREDICTION_MARKET', bg: 'bg-amber-100', text: 'text-amber-700' },
  { value: 'SURVIVAL_TRIVIA', label: 'SURVIVAL_TRIVIA', bg: 'bg-blue-100', text: 'text-blue-700' },
];

const MINTING_EVENT_OPTIONS = [
  { id: '', name: '민팅 이벤트 선택...' },
  { id: '23', name: 'V01D Welcome ED' },
  { id: '24', name: 'V01D Trivia Master' },
  { id: '25', name: 'V01D Final Boss' },
  { id: '26', name: 'V01D Prophet' },
  { id: '27', name: 'V01D 100 Days' },
];

export default function QuestCreatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const storyId = parseInt(id, 10);
  const story = getStoryQuestById(storyId);
  const group = story ? getGroupById(story.groupId) : undefined;
  const existingQuests = getEpisodesByStoryId(storyId);
  const router = useRouter();

  const nextOrder = existingQuests.length + 1;
  const canAdd = existingQuests.length < MAX_EPISODES_PER_STORY;
  const artist = group?.artistGroup;

  const [type, setType] = useState<EpisodeType | ''>('');
  const [sourceRefId, setSourceRefId] = useState<string>('');
  const [gameCondition, setGameCondition] = useState<GameCondition>('PARTICIPATION_COUNT');
  const [conditionValue, setConditionValue] = useState<number>(1);
  const [rewardEntryTicket, setRewardEntryTicket] = useState(5);
  const [rewardFanPoint, setRewardFanPoint] = useState(100);
  const [repeat, setRepeat] = useState(false);
  const [biveRewardYn, setBiveRewardYn] = useState(false);
  const [mintingEventId, setMintingEventId] = useState('');

  if (!story || !group || !artist) {
    return <div className="p-8 text-sm text-gray-500">에피소드 또는 그룹을 찾을 수 없습니다.</div>;
  }

  // 본 에피소드의 종류 — REPEAT면 반복 설정된 팬퀘스트만 노출
  const isRepeatEpisode = story.episodeKind === 'REPEAT';

  // 유형별 소스 리스트 (FAN_QUEST만 — PM/ST는 아티스트의 모든 콘텐츠 누적 검증)
  const fanQuestOptions =
    type === 'FAN_QUEST'
      ? isRepeatEpisode
        ? getRepeatFanQuestsByArtist(artist)
        : getFanQuestsByArtist(artist)
      : [];

  const isGameType = type === 'PREDICTION_MARKET' || type === 'SURVIVAL_TRIVIA';
  const isFanQuest = type === 'FAN_QUEST';
  const selectedSource = fanQuestOptions.find((o) => String(o.id) === sourceRefId);

  const isValid =
    canAdd &&
    type !== '' &&
    // FAN_QUEST: 팬퀘스트 참조 필수 / PM·ST: 참조 불필요(아티스트 누적)
    (isFanQuest ? sourceRefId !== '' : true) &&
    // PM·ST만 보상·조건 검증
    (!isGameType || (rewardEntryTicket >= 0 && rewardFanPoint >= 0 && conditionValue >= 1)) &&
    (!isGameType || !biveRewardYn || mintingEventId !== '');

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 사라집니다. 취소하시겠어요?')) {
      router.push(`/sq/${storyId}`);
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    let summary: string;
    if (isFanQuest) {
      const sourceLabel = selectedSource?.title ?? `#${sourceRefId}`;
      summary = `[Mock] 미션 추가 — FAN_QUEST 참조 '${sourceLabel}' (보상은 팬퀘스트 자체 정책 적용)`;
    } else {
      summary = `[Mock] 미션 추가 — ${type} / 조건: ${artist} 아티스트의 모든 ${type === 'PREDICTION_MARKET' ? 'PM' : 'ST'} ${GAME_CONDITION_LABEL[gameCondition]} ${conditionValue}회 이상 / 응모권 +${rewardEntryTicket}장 / 덕력 +${rewardFanPoint} / BIVE ${biveRewardYn ? 'ON' : 'OFF'}`;
    }
    alert(summary);
    router.push(`/sq/${storyId}`);
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '에피소드', href: '/sq/groups/list' },
          { label: story.titleKO, href: `/sq/${storyId}` },
          { label: '새 미션 추가' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleCancel} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900">
              새 미션 추가 <span className="text-base font-normal text-gray-500">({existingQuests.length}/{MAX_EPISODES_PER_STORY})</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 mr-2">
                {artist}
              </span>
              에피소드: {story.titleKO}
            </p>
          </div>
        </div>
      </div>

      {!canAdd && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-800 leading-relaxed">
            본 에피소드는 이미 최대치({MAX_EPISODES_PER_STORY}개)의 미션을 보유하고 있어 추가할 수 없습니다.
          </p>
        </div>
      )}

      {isRepeatEpisode && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-violet-900 mb-0.5">반복 에피소드 (REPEAT)</p>
            <p className="text-xs text-violet-800 leading-relaxed">
              본 에피소드는 <strong>반복 가능한 콘텐츠</strong>만 등록할 수 있습니다.
              FAN_QUEST 드롭다운에는 <strong>반복 설정된 팬퀘스트</strong>만 노출되며, PM/ST는 그룹 기간 동안 누적 횟수로 검증됩니다.
            </p>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <InformationCircleIcon className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900 mb-0.5">미션 생성 정책</p>
          <p className="text-xs text-indigo-800 leading-relaxed">
            미션은 외부 콘텐츠(팬퀘스트·PM·ST)를 <strong>참조</strong>하여 에피소드 안에 묶는 단위입니다.
            그룹 아티스트(<strong>{artist}</strong>)의 콘텐츠만 선택할 수 있습니다.
          </p>
          <ul className="text-xs text-indigo-800 leading-relaxed mt-2 list-disc list-inside space-y-0.5">
            <li><strong>FAN_QUEST</strong>: 팬퀘스트 리스트에서 선택. 타이틀·설명·이미지·반복·BIVE 보상 등은 <strong>팬퀘스트 자체</strong>에서 관리합니다.</li>
            <li><strong>PREDICTION_MARKET / SURVIVAL_TRIVIA</strong>: 게임 선택 + 완료 조건(참여 횟수 / 승리 횟수)과 보상을 본 화면에서 설정합니다.</li>
          </ul>
        </div>
      </div>

      {/* 섹션 1 — 기본 정보 + 유형 선택 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-base font-semibold text-gray-900 mb-4">기본 정보</h4>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">표시 순서 <span className="text-[11px] text-gray-400 font-normal">(자동)</span></label>
            <div className="h-11 px-3 inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono">
              #{nextOrder} / {MAX_EPISODES_PER_STORY}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">유형 <span className="text-red-500">*</span></label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as EpisodeType | '');
                setSourceRefId('');
              }}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">유형 선택...</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FAN_QUEST 전용: 팬퀘스트 참조 드롭다운 */}
        {isFanQuest && (
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              팬퀘스트 참조 <span className="text-red-500">*</span>
              <span className="text-[11px] text-gray-400 font-normal ml-1">({artist} 아티스트 콘텐츠만)</span>
            </label>
            {fanQuestOptions.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                {artist} 아티스트에 등록된 팬퀘스트가 없습니다. 먼저 팬퀘스트 영역에서 콘텐츠를 생성하세요.
              </div>
            ) : (
              <select
                value={sourceRefId}
                onChange={(e) => setSourceRefId(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">팬퀘스트 선택...</option>
                {fanQuestOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    [{o.status}] {o.title} (#{o.id})
                  </option>
                ))}
              </select>
            )}

            {selectedSource && (
              <div className="mt-3 bg-pink-50 border border-pink-100 rounded-lg p-3 text-[11px] text-pink-800 leading-relaxed">
                <strong>참조 완료</strong>: 본 팬퀘스트의 <strong>타이틀·설명·이미지·반복·보상·BIVE 보상 등 모든 설정</strong>은 팬퀘스트 영역에서 관리됩니다.
                본 화면에서는 추가 입력이 필요하지 않습니다.
              </div>
            )}
          </div>
        )}

        {/* PM/ST 안내: 참조 없이 아티스트 누적 검증 */}
        {isGameType && (
          <div className="border-t border-gray-100 pt-5">
            <div className={`rounded-lg p-3 text-[11px] leading-relaxed ${
              type === 'PREDICTION_MARKET' ? 'bg-amber-50 border border-amber-100 text-amber-800' : 'bg-blue-50 border border-blue-100 text-blue-800'
            }`}>
              <strong>참조 콘텐츠 없음</strong>: 특정 {type === 'PREDICTION_MARKET' ? 'PM' : 'ST'}이 아니라 <strong>{artist} 아티스트의 모든 {type === 'PREDICTION_MARKET' ? 'Prediction Market' : 'Survival Trivia'}</strong>에서의 누적 참여/승리 횟수로 검증됩니다.
              아래에서 완료 조건과 보상을 설정하세요.
            </div>
          </div>
        )}
      </div>

      {/* 섹션 2 — PM/ST 완료 조건 (게임 유형만) */}
      {isGameType && type && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h4 className="text-base font-semibold text-gray-900 mb-4">완료 조건</h4>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">조건 유형 <span className="text-red-500">*</span></label>
              <select
                value={gameCondition}
                onChange={(e) => setGameCondition(e.target.value as GameCondition)}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="PARTICIPATION_COUNT">참여 횟수 (PARTICIPATION_COUNT)</option>
                <option value="WIN_COUNT">{type === 'PREDICTION_MARKET' ? '정답 횟수 (PM 승리)' : '생존 횟수 (ST 승리)'}</option>
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
                value={conditionValue}
                onChange={(e) => setConditionValue(Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
            예: <strong>{GAME_CONDITION_LABEL[gameCondition]} {conditionValue}회 이상</strong> 충족 시 본 미션 완료로 인정됩니다.
            팬은 그룹 기간 내 해당 {type === 'PREDICTION_MARKET' ? 'PM' : 'ST'} 콘텐츠에서 누적된 기록으로 판정됩니다.
          </p>
        </div>
      )}

      {/* 섹션 3 — 보상 설정 (PM/ST 전용 — 미선택·FAN_QUEST는 숨김) */}
      {isGameType && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h4 className="text-base font-semibold text-gray-900 mb-4">보상 설정</h4>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">응모권 (장) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                value={rewardEntryTicket}
                onChange={(e) => setRewardEntryTicket(parseInt(e.target.value || '0', 10))}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">덕력 (DUK) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                value={rewardFanPoint}
                onChange={(e) => setRewardFanPoint(parseInt(e.target.value || '0', 10))}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900">반복 여부</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeat}
                  onChange={(e) => setRepeat(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                <span className="ml-2 text-sm text-gray-700">{repeat ? '반복' : '단발성'}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 4 — BIVE 보상 (PM/ST만, FAN_QUEST는 팬퀘스트 자체에서 관리) */}
      {isGameType && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-900">BIVE 보상</h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={biveRewardYn}
                onChange={(e) => setBiveRewardYn(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {biveRewardYn ? <span className="text-indigo-700">ON</span> : 'OFF'}
              </span>
            </label>
          </div>

          {biveRewardYn ? (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                민팅 이벤트 <span className="text-red-500">*</span>
                <span className="text-[11px] text-gray-400 font-normal ml-1">(ON 시 필수)</span>
              </label>
              <select
                value={mintingEventId}
                onChange={(e) => setMintingEventId(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white"
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
      )}

      {type && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
          <p className="text-xs text-amber-800 leading-relaxed">
            {isFanQuest ? (
              <>
                <strong>참조 완료 후 즉시 등록 가능</strong>: FAN_QUEST 유형은 참조 팬퀘스트가 곧 콘텐츠이므로 추가 입력 없이 [미션 추가] 버튼으로 등록됩니다.
                보상은 팬퀘스트 영역에서 설정한 값이 적용됩니다.
              </>
            ) : (
              <>
                <strong>판정 유형 + 보상 설정 후 등록</strong>: 본 미션은 {artist} 아티스트의 모든 {type === 'PREDICTION_MARKET' ? 'PM' : 'ST'}에서 누적된 기록으로 검증되며,
                v2.2부터 <strong>완료 조건은 미션에 직접 흡수</strong>됩니다 (미션 1개 = 완료 판정 1개).
              </>
            )}
          </p>
        </div>
      )}

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
          미션 추가
        </button>
      </div>
    </div>
  );
}
