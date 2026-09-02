'use client';

import { useState } from 'react';

import { ErrorBanner } from '../_components/feedback';
import { LinkIcon, PostIcon, UserIcon } from '../_components/icons';
import { INPUT, MUTED, PRIMARY_BUTTON } from '../_components/ui';
import { EvidenceField } from './evidence-field';
import { StepCard } from './step-card';
import { useEvidenceUpload } from './use-evidence-upload';
import type { ReportTargetType } from '@/lib/api-types';

/** 상세 내용 최대 입력 길이 — 3단계 중 유일한 자유 입력이며 선택 사항이다 */
const MAX_DETAIL_LENGTH = 1000;

const TARGET_TILES: Array<{ type: ReportTargetType; icon: typeof PostIcon }> = [
  { type: '게시물', icon: PostIcon },
  { type: '계정', icon: UserIcon },
  { type: '외부 링크', icon: LinkIcon },
];

const REASON_CHIPS = [
  '정가 초과 판매',
  '매크로/우회 프로그램 이용',
  '대리 구매/양도',
  '허위 정보/사기',
  '티켓 독점/유통 방해',
  '기타',
] as const;

export interface ReportSubmitInput {
  targetType: ReportTargetType;
  reason: string;
  detail: string;
  evidenceUrl: string;
  /** 미리 올려 둔 증빙 이미지의 보관함 경로 목록 */
  evidenceFiles: string[];
}

interface ReportFormProps {
  busy: boolean;
  serverError: string;
  onSubmit: (input: ReportSubmitInput) => void;
}

/**
 * A7 신고 접수 폼 — "선택 2번이면 접수"되는 3단계 구성.
 * 법령 안내보다 즉시 행동 가능한 선택지를 앞세워 신고 진입 장벽을 낮춘다.
 */
export function ReportForm({ busy, serverError, onSubmit }: ReportFormProps) {
  const [targetType, setTargetType] = useState<ReportTargetType | null>(null);
  const [reason, setReason] = useState<string>('');
  const [detail, setDetail] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const evidence = useEvidenceUpload();

  const canSubmit = targetType !== null && reason !== '' && !evidence.isUploading;

  const handleSubmit = () => {
    if (!canSubmit || busy) return;
    onSubmit({
      targetType: targetType as ReportTargetType,
      reason,
      detail: detail.trim(),
      evidenceUrl: evidenceUrl.trim(),
      evidenceFiles: evidence.attachments.map((item) => item.path),
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <StepCard step={1} title="신고 대상" required>
        <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="신고 대상">
          {TARGET_TILES.map(({ type, icon: Icon }) => {
            const isSelected = targetType === type;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setTargetType(type)}
                className={`relative flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-xl border px-2 pb-3 pt-6 ${
                  isSelected ? 'border-[#D6336C] bg-[#FDF2F7]' : 'border-[#E5E8EB] bg-white'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-[#D6336C]' : 'border-[#D9DEE4]'
                  }`}
                >
                  {isSelected ? <span className="h-2 w-2 rounded-full bg-[#D6336C]" /> : null}
                </span>
                <Icon className={`h-7 w-7 ${isSelected ? 'text-[#D6336C]' : 'text-[#4E5968]'}`} />
                <span className="text-[13.5px] font-semibold text-[#191F28]">{type}</span>
              </button>
            );
          })}
        </div>
      </StepCard>

      <StepCard step={2} title="신고 사유" required>
        <div className="flex flex-wrap gap-2">
          {REASON_CHIPS.map((chip) => {
            const isSelected = reason === chip;
            return (
              <button
                key={chip}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setReason(chip)}
                className={`rounded-xl border px-3.5 py-2.5 text-[13.5px] font-semibold ${
                  isSelected
                    ? 'border-[#D6336C] bg-[#FDF2F7] text-[#D6336C]'
                    : 'border-[#E5E8EB] bg-white text-[#191F28]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </StepCard>

      <StepCard step={3} title="추가 정보" required={false}>
        <div className="flex flex-col gap-3.5">
          <div>
            <p className="mb-1.5 text-[13.5px] font-semibold text-[#191F28]">상세 내용</p>
            <div className="relative">
              <textarea
                value={detail}
                maxLength={MAX_DETAIL_LENGTH}
                rows={4}
                placeholder="신고 내용을 자세히 입력해 주세요."
                onChange={(event) => setDetail(event.target.value)}
                className={`${INPUT} resize-none pb-7 leading-relaxed`}
              />
              <span className={`absolute bottom-2.5 right-3 text-[12px] ${MUTED}`}>
                {detail.length}/{MAX_DETAIL_LENGTH}
              </span>
            </div>
          </div>

          <EvidenceField
            evidenceUrl={evidenceUrl}
            onEvidenceUrlChange={setEvidenceUrl}
            attachments={evidence.attachments}
            isUploading={evidence.isUploading}
            uploadError={evidence.errorMessage}
            onAttach={(file) => void evidence.attach(file)}
            onRemove={evidence.remove}
          />
        </div>
      </StepCard>

      {serverError ? <ErrorBanner message={serverError} /> : null}

      {canSubmit ? null : (
        <p className={`px-1 text-center text-[13px] ${MUTED}`}>
          신고 대상과 사유를 선택하면 접수할 수 있어요
        </p>
      )}
      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={handleSubmit}
        className={PRIMARY_BUTTON}
      >
        {busy ? '접수 중…' : '신고 접수하기'}
      </button>

      <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>
        허위 신고가 반복되면 신고 기능 사용이 제한될 수 있습니다.
      </p>
    </div>
  );
}
