'use client';

import { CheckIcon } from '../_components/icons';
import { MUTED, NUMERIC } from '../_components/ui';
import { formatDateTime } from '@/lib/format';

/**
 * 해결 블록 껍데기 — 번호 + 제목 + 설명 + 내용.
 * 회원이 "지금 할 일"을 순서대로 따라갈 수 있도록 번호를 앞세운다.
 */
export function ResolutionBlock({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E5E8EB] bg-white p-4">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FDF2F7] text-[13px] font-bold text-[#D6336C] ${NUMERIC}`}
        >
          {step}
        </span>
        <div className="min-w-0">
          <h4 className="text-[15px] font-bold text-[#191F28]">{title}</h4>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[#4E5968]">{description}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * 전달 완료 표시 — 회원이 알린 값과 시각을 그대로 되짚어 준다.
 * 잘못 적었을 수 있으므로 [수정]을 항상 함께 둔다.
 */
export function SubmittedNote({
  rows,
  submittedAt,
  message,
  onEdit,
}: {
  rows: Array<{ label: string; value: string }>;
  submittedAt: string | null;
  message: string;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#ECFDF3] p-3.5">
      <div className="flex items-center gap-1.5">
        <CheckIcon className="h-4 w-4 text-[#12B76A]" />
        <span className="text-[14px] font-bold text-[#027A48]">전달 완료</span>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-[#027A48]">{message}</p>

      <dl className="mt-2.5 flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[13px] text-[#4E5968]">{row.label}</dt>
            <dd className={`text-[14px] font-semibold text-[#191F28] ${NUMERIC}`}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        {submittedAt ? (
          <span className={`text-[12.5px] ${NUMERIC} ${MUTED}`}>
            전달 {formatDateTime(submittedAt)}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onEdit}
          className="min-h-[36px] rounded-[10px] border border-[#E5E8EB] bg-white px-3.5 text-[13px] font-semibold text-[#191F28]"
        >
          수정
        </button>
      </div>
    </div>
  );
}

/** 블록 안 실행 버튼 — 카드 폭에 맞춘 주 버튼 */
export function BlockSubmitButton({
  label,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#D6336C] px-4 text-[15px] font-bold text-white transition disabled:bg-[#E5E8EB] disabled:text-[#B0B8C1]"
    >
      {busy ? '전달 중…' : label}
    </button>
  );
}

/** 블록 안 오류 문구 */
export function BlockError({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-2 text-[12.5px] leading-relaxed text-[#D92D20]">{message}</p>;
}
