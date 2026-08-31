'use client';

import { useState } from 'react';

import { ErrorBanner } from '../_components/feedback';
import { Field, TextInput } from '../_components/form-controls';
import { SectionCard } from '../_components/section';
import { INPUT, MUTED, PRIMARY_BUTTON } from '../_components/ui';
import type { ReportTargetType } from '@/lib/api-types';

/** 상세 내용 최소 입력 길이 */
const MIN_DETAIL_LENGTH = 10;
const MAX_DETAIL_LENGTH = 500;

const TARGET_TYPES: ReportTargetType[] = ['게시물', '계정', '외부 링크'];

const REASONS = ['암표 판매', '매크로 의심', '양도 권유', '기타'] as const;

export interface ReportSubmitInput {
  targetType: ReportTargetType;
  reason: string;
  detail: string;
  evidenceUrl: string;
}

interface ReportFormProps {
  busy: boolean;
  serverError: string;
  onSubmit: (input: ReportSubmitInput) => void;
}

/** A7 신고 접수 폼 */
export function ReportForm({ busy, serverError, onSubmit }: ReportFormProps) {
  const [targetType, setTargetType] = useState<ReportTargetType>('게시물');
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [detail, setDetail] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = () => {
    if (detail.trim().length < MIN_DETAIL_LENGTH) {
      setErrorMessage(`상세 내용을 ${MIN_DETAIL_LENGTH}자 이상 입력해 주세요.`);
      return;
    }
    setErrorMessage('');
    onSubmit({ targetType, reason, detail: detail.trim(), evidenceUrl: evidenceUrl.trim() });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <SectionCard title="신고 대상">
        <div className="flex flex-col gap-1">
          {TARGET_TYPES.map((type) => (
            <label key={type} className="flex min-h-[44px] cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="targetType"
                checked={targetType === type}
                onChange={() => setTargetType(type)}
                className="h-4.5 w-4.5 accent-[#D6336C]"
              />
              <span className="text-[14.5px] text-[#191F28]">{type}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="신고 내용">
        <div className="flex flex-col gap-3.5">
          <Field label="신고 사유">
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className={INPUT}
            >
              {REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="상세 내용"
            hint={`${MIN_DETAIL_LENGTH}자 이상 입력해 주세요. (${detail.trim().length}/${MAX_DETAIL_LENGTH})`}
          >
            <textarea
              value={detail}
              maxLength={MAX_DETAIL_LENGTH}
              rows={5}
              placeholder="판매 가격, 거래 방식, 확인한 시각 등 확인에 도움이 되는 내용을 적어 주세요."
              onChange={(event) => setDetail(event.target.value)}
              className={`${INPUT} resize-none leading-relaxed`}
            />
          </Field>

          <Field label="증빙 링크 (선택)" hint="게시물 주소나 대화 캡처를 올려둔 주소를 입력해 주세요.">
            <TextInput
              value={evidenceUrl}
              onChange={setEvidenceUrl}
              inputMode="url"
              placeholder="https://"
            />
          </Field>
        </div>
      </SectionCard>

      {errorMessage || serverError ? <ErrorBanner message={errorMessage || serverError} /> : null}

      <button type="button" disabled={busy} onClick={handleSubmit} className={PRIMARY_BUTTON}>
        {busy ? '접수 중…' : '신고 접수하기'}
      </button>

      <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>
        허위 신고가 반복되면 신고 기능 사용이 제한될 수 있습니다.
      </p>
    </div>
  );
}
