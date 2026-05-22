'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { getGameById, type GameType } from '@/mock/gamezone';
import { ConfirmCreateCancelModal, ConfirmEditCancelModal } from '@/components/gamezone/GameModals';

// [CEB-BO-GZ-201-CREATE] 게임 생성 + [CEB-BO-GZ-202-EDIT] 게임 수정 (공용 폼)
// 운영 BO 정합: /gamezone/games/create?mode={create|edit}&predictionMarketId={id}|&survivalTriviaId={id}
// 명세 [201-CREATE] v3.1 / [202-EDIT] v2.7

type Mode = 'create' | 'edit';

const TITLE_MAX = 35;
const RESULT_CRITERIA_MAX = 500;

function GameCreateContent() {
  const router = useRouter();
  const search = useSearchParams();
  const mode: Mode = (search.get('mode') as Mode) || 'create';
  const pmId = search.get('predictionMarketId');
  const stId = search.get('survivalTriviaId');
  const editId = pmId || stId;
  const editGame = editId ? getGameById(parseInt(editId, 10)) : undefined;

  const isEdit = mode === 'edit' && !!editGame;
  const editStatus = editGame?.status;

  // 폼 상태
  const [type, setType] = useState<GameType>(editGame?.type ?? 'PM');
  const [titleKo, setTitleKo] = useState(editGame?.title ?? '');
  const [titleEn, setTitleEn] = useState(editGame?.titleEN ?? '');
  const [titleJa, setTitleJa] = useState(editGame?.titleJP ?? '');
  const [description, setDescription] = useState(editGame?.description ?? '');
  const [hintUse, setHintUse] = useState(false);
  const [hintUrl, setHintUrl] = useState('');
  const [totalPrize, setTotalPrize] = useState<string>(editGame?.type === 'PM' ? String(editGame.totalPrize) : '10000');
  const [unlimited, setUnlimited] = useState(true);
  const [participationCost, setParticipationCost] = useState<string>(editGame?.type === 'PM' ? String(editGame.participationCost) : '1');
  const [boostingCost, setBoostingCost] = useState<string>(editGame?.type === 'PM' ? String(editGame.boostingCost) : '1');
  const [boostingMultiplier, setBoostingMultiplier] = useState<string>(editGame?.type === 'PM' ? String(editGame.boostingMultiplier) : '2');
  const [endDate, setEndDate] = useState<string>(editGame?.type === 'PM' ? editGame.votingEnd : '');
  const [endTime, setEndTime] = useState('00:00');
  const [resultAnnounce, setResultAnnounce] = useState<string>(editGame?.type === 'PM' ? editGame.resultAnnounceDate : '');
  const [resultCriteria, setResultCriteria] = useState('');
  // ST 필드
  const [stTimeLimit, setStTimeLimit] = useState('10');
  const [stAnswerReveal, setStAnswerReveal] = useState('5');
  const [stMaxParticipants, setStMaxParticipants] = useState<string>(editGame?.type === 'ST' ? String(editGame.maxParticipants) : '');
  const [stMaxPrize, setStMaxPrize] = useState<string>(editGame?.type === 'ST' ? String(editGame.maxPrize) : '');
  const [stMultiplier, setStMultiplier] = useState('1.25');
  const [stStartDate, setStStartDate] = useState('');

  // 잠금 매트릭스 (PM Pending만 운영 실측, 나머지는 명세 기반)
  const isFieldLocked = (field: 'all' | 'date-only-result') => {
    if (!isEdit) return false;
    if (editStatus === '결과대기') {
      // Pending: 결과 발표 예정일·결과 확인 기준만 활성
      return field === 'all';
    }
    if (editStatus === '진행중') {
      // Active: 타이틀·상세설명·(PM 결과 확인 기준)만 활성
      return field === 'all'; // 더 정교한 분기는 추후
    }
    return false;
  };

  // [생성하기]/[저장하기] 활성 조건
  const initialSnapshot = useMemo(() => JSON.stringify({ type, titleKo, titleEn, titleJa, description, totalPrize, participationCost, boostingCost, boostingMultiplier, endDate, resultAnnounce, resultCriteria }), [editGame]);
  const currentSnapshot = JSON.stringify({ type, titleKo, titleEn, titleJa, description, totalPrize, participationCost, boostingCost, boostingMultiplier, endDate, resultAnnounce, resultCriteria });
  const hasChanged = currentSnapshot !== initialSnapshot;
  const requiredFilled = type === 'PM'
    ? !!titleKo.trim() && !!description.trim() && !!totalPrize && !!endDate && !!resultAnnounce && !!resultCriteria.trim()
    : !!titleKo.trim() && !!description.trim() && !!stMaxParticipants && !!stMaxPrize && !!stStartDate;
  const canSubmit = isEdit ? (hasChanged && requiredFilled) : requiredFilled;

  const [cancelOpen, setCancelOpen] = useState(false);
  const handleCancel = () => setCancelOpen(true);
  const onConfirmCancel = () => {
    setCancelOpen(false);
    router.push(isEdit ? `/gamezone/games/${editId}` : '/gamezone/games');
  };

  const handleSubmit = (asDraft = false) => {
    const action = isEdit ? '저장' : (asDraft ? '임시저장' : '생성');
    alert(`[Mock] ${action} 완료 — 실제 저장 로직은 추후 구현`);
    router.push(isEdit ? `/gamezone/games/${editId}` : '/gamezone/games');
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={isEdit ? '게임 수정' : '게임 생성'}
          breadcrumbItems={[
            { label: '게임존', href: '/gamezone/home' },
            { label: '게임 관리', href: '/gamezone/games' },
            { label: isEdit ? '게임 수정' : '게임 생성' },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          {!isEdit && (
            <button
              onClick={() => handleSubmit(true)}
              className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              임시저장
            </button>
          )}
          <button
            disabled={!canSubmit}
            onClick={() => handleSubmit(false)}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isEdit ? '저장하기' : '생성하기'}
          </button>
        </div>
      </div>

      {isEdit && editStatus === '결과대기' && (
        <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-lg text-sm mb-6">
          결과 대기 중인 게임은 결과 발표 예정일과 결과 확인 기준만 수정할 수 있습니다.
        </div>
      )}

      <div className="grid grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Section title="기본정보">
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-900 mb-2">게임유형</label>
              {isEdit ? (
                <div className="text-sm text-gray-900">{type === 'PM' ? 'Prediction Market' : 'Survival Trivia'}</div>
              ) : (
                <div className="flex gap-4">
                  {(['PM', 'ST'] as GameType[]).map((t) => (
                    <label key={t} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={type === t} onChange={() => setType(t)} className="w-4 h-4 accent-indigo-600" />
                      <span className="text-sm">{t === 'PM' ? 'Prediction Market' : 'Survival Trivia'}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <I18nField label="타이틀" required maxLength={TITLE_MAX} values={{ KO: titleKo, EN: titleEn, JA: titleJa }} onChange={(lang, v) => { if (lang === 'KO') setTitleKo(v); if (lang === 'EN') setTitleEn(v); if (lang === 'JA') setTitleJa(v); }} disabled={isFieldLocked('all')} />

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-900 mb-2">상세설명 <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isFieldLocked('all')}
                placeholder="게임 상세 설명을 입력하세요 (WYSIWYG 에디터는 별도 사이클에서 통합 예정)"
                className="w-full min-h-[160px] p-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <ImageDrop label="배너 이미지" ratio="3:2" disabled={isFieldLocked('all')} />
              {type === 'PM' && <ImageDrop label="상세 이미지" ratio="1:1" disabled={isFieldLocked('all')} />}
            </div>

            {type === 'PM' && (
              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-900 mb-2">힌트 링크</label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setHintUse(true)} disabled={isFieldLocked('all')} className={`h-9 px-4 text-sm rounded-lg border ${hintUse ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`}>사용</button>
                  <button onClick={() => setHintUse(false)} disabled={isFieldLocked('all')} className={`h-9 px-4 text-sm rounded-lg border ${!hintUse ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`}>미사용</button>
                </div>
                {hintUse && (
                  <input value={hintUrl} onChange={(e) => setHintUrl(e.target.value)} placeholder="https://" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" />
                )}
              </div>
            )}
          </Section>

          {type === 'PM' ? (
            <>
              <Section title="보상설정">
                <NumberField label="총 상금 GP" required unit="GP" value={totalPrize} onChange={setTotalPrize} disabled={isFieldLocked('all')} />
              </Section>
              <Section title="참여설정">
                <div className="mb-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!unlimited} onChange={(e) => setUnlimited(!e.target.checked)} disabled={isFieldLocked('all')} className="w-4 h-4 accent-indigo-600" />
                    <span className="text-sm">참여 정원 제한</span>
                    {unlimited && <span className="text-xs text-gray-500">(무제한)</span>}
                  </label>
                </div>
                <NumberField label="참여 비용" required unit="GP" value={participationCost} onChange={setParticipationCost} disabled={isFieldLocked('all')} />
                <NumberField label="부스팅 비용" required unit="GP" value={boostingCost} onChange={setBoostingCost} disabled={isFieldLocked('all')} />
                <NumberField label="부스팅 배수" required unit="배" value={boostingMultiplier} onChange={setBoostingMultiplier} disabled={isFieldLocked('all')} hint="부스팅 GP는 보상 계산 시 해당 배수만큼 가중치가 적용됩니다." />
              </Section>
              <Section title="일정설정">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-900 mb-1">투표 시작일시</label>
                  <div className="text-xs text-gray-500">(게시 시점에 자동 설정)</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DateField label="투표 종료일시" required value={endDate} onChange={setEndDate} disabled={isFieldLocked('all')} time={endTime} onTimeChange={setEndTime} />
                  <DateField label="결과 발표 예정일" required value={resultAnnounce} onChange={setResultAnnounce} disabled={editStatus === '결과대기' ? false : isFieldLocked('all')} />
                </div>
              </Section>
              <Section title="결과설정">
                <I18nField label="결과 확인 기준" required maxLength={RESULT_CRITERIA_MAX} multiline values={{ KO: resultCriteria, EN: '', JA: '' }} onChange={(_lang, v) => setResultCriteria(v)} disabled={editStatus === '결과대기' ? false : isFieldLocked('all')} />
              </Section>
            </>
          ) : (
            <>
              <Section title="퀴즈설정 (ST 전용)">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <NumberField label="제한시간" required unit="초 (10~60)" value={stTimeLimit} onChange={setStTimeLimit} />
                  <NumberField label="정답 결과 노출시간" required unit="초 (1~10)" value={stAnswerReveal} onChange={setStAnswerReveal} />
                </div>
                <div className="text-sm text-gray-500">퀴즈 목록·문제 입력 UI는 #B-PT-3 추가 작업에서 구현 예정 (Q1~Q10, 다국어 탭, 선택지 1~4 + 정답 라디오)</div>
              </Section>
              <Section title="ST 참여설정">
                <NumberField label="최대 모집인원" required unit="명" value={stMaxParticipants} onChange={setStMaxParticipants} />
              </Section>
              <Section title="ST 보상설정">
                <NumberField label="최대 상금풀" required unit="GP" value={stMaxPrize} onChange={setStMaxPrize} />
                <NumberField label="배수" required value={stMultiplier} onChange={setStMultiplier} hint="예: 1.25" />
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-900 mb-1">참여비</label>
                  <div className="text-sm text-gray-500">- (자동 계산)</div>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm">
                  적용 상금풀 = 실제 모집인원 / 최대 모집인원 × 최대 상금풀<br />
                  게임 시작 시 실제 모집인원에 비례하여 상금풀이 자동 결정됩니다.
                </div>
                <NumberField label="탈락자 응모권 수량" required unit="장" value="1" onChange={() => {}} hint="팬퀘스트 응모권" />
                <div className="text-xs text-gray-500 mt-2">부스팅은 Survival Trivia에서 지원하지 않습니다.</div>
              </Section>
              <Section title="ST 일정설정">
                <DateField label="게임 시작일시" required value={stStartDate} onChange={setStStartDate} hint="최소 1시간 이전에 설정하는 것을 권장합니다." />
              </Section>
            </>
          )}

          <div className="text-xs text-gray-500">
            {isEdit ? '변경된 내용이 있을 때만 저장할 수 있습니다.' : '모든 필수값을 입력하면 생성하기가 활성화됩니다.'}
          </div>
        </div>

        {/* 우측 사이드 — 앱 미리보기 */}
        <aside className="bg-gradient-to-b from-indigo-50 to-white rounded-xl border border-indigo-100 p-5 sticky top-6 self-start">
          <div className="text-sm font-semibold text-gray-900 mb-3">앱 미리보기</div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{type === 'PM' ? '200명 참여중' : '500명 참여중'}</div>
            <div className="aspect-[3/2] bg-gradient-to-br from-indigo-100 to-purple-100 rounded mb-3 flex items-center justify-center text-xs text-indigo-600">
              {type === 'PM' ? 'Prediction Game' : 'Survival Trivia'}
            </div>
            <div className="text-sm font-medium text-gray-900 mb-2 whitespace-pre-wrap">
              {titleKo || (type === 'PM' ? 'Will V01D take #1 on Inkigayo this week?' : '제 1회 V01D 모의고사')}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                {type === 'PM' ? '진행중' : '시작전'}
              </span>
              <span className="text-xs text-gray-500">{type === 'PM' ? '2일 22:55:40 남음' : '오늘 13:00 (KST)'}</span>
            </div>
            <div className="text-xs text-indigo-600 mb-3">
              {type === 'PM' ? `${(parseInt(totalPrize) || 0).toLocaleString()}GP 획득 가능` : '지금 입장하기'}
            </div>
            <button className="w-full h-9 text-sm font-medium text-white bg-indigo-600 rounded-lg">
              {type === 'PM' ? '참여하기' : '지금 입장하기'}
            </button>
          </div>
        </aside>
      </div>

      {/* 취소 확인 모달 */}
      {isEdit ? (
        <ConfirmEditCancelModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={onConfirmCancel} />
      ) : (
        <ConfirmCreateCancelModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={onConfirmCancel} />
      )}
    </div>
  );
}

// ─────────────── 공통 ───────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function I18nField({
  label, required, maxLength, multiline, values, onChange, disabled,
}: {
  label: string;
  required?: boolean;
  maxLength?: number;
  multiline?: boolean;
  values: { KO: string; EN: string; JA: string };
  onChange: (lang: 'KO' | 'EN' | 'JA', value: string) => void;
  disabled?: boolean;
}) {
  const [lang, setLang] = useState<'KO' | 'EN' | 'JA'>('KO');
  const value = values[lang];
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-1 mb-2">
        {(['KO', 'EN', 'JA'] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)} disabled={disabled} className={`px-3 h-8 text-xs rounded ${lang === l ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{l}</button>
        ))}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(lang, e.target.value.slice(0, maxLength))}
          disabled={disabled}
          placeholder={`${label} (${lang})`}
          className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(lang, e.target.value.slice(0, maxLength))}
          disabled={disabled}
          placeholder={`${label} (${lang})`}
          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
        />
      )}
      {maxLength && (
        <div className="mt-1 text-right text-xs text-gray-400">{value.length}/{maxLength}</div>
      )}
    </div>
  );
}

function NumberField({ label, required, unit, value, onChange, disabled, hint }: {
  label: string; required?: boolean; unit?: string; value: string; onChange: (v: string) => void; disabled?: boolean; hint?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          disabled={disabled}
          className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
        />
        {unit && <span className="text-sm text-gray-500 whitespace-nowrap">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function DateField({ label, required, value, onChange, disabled, time, onTimeChange, hint }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; disabled?: boolean; time?: string; onTimeChange?: (v: string) => void; hint?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
        />
        {time !== undefined && onTimeChange && (
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={disabled}
            className="w-24 h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-500"
          />
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function ImageDrop({ label, ratio, disabled }: { label: string; ratio: string; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>
      <div className={`border-2 border-dashed rounded-lg p-6 text-center text-sm ${disabled ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300 text-gray-500 hover:border-indigo-400'}`}>
        클릭하거나 파일을 드래그하세요
        <div className="text-xs text-gray-400 mt-1">{label} ({ratio} 비율) · jpeg, png, jpg, webp (최대 5MB)</div>
      </div>
    </div>
  );
}

export default function GameCreatePage() {
  return (
    <Suspense fallback={null}>
      <GameCreateContent />
    </Suspense>
  );
}
