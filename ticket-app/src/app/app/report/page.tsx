'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AppHeader } from '../_components/app-header';
import { CheckIcon, ChevronDownIcon, ReceiptIcon, ShieldIcon } from '../_components/icons';
import { NoticeBox } from '../_components/section';
import { CARD, GHOST_BUTTON, MUTED, NUMERIC } from '../_components/ui';
import { useAppToast } from '../_components/toast';
import { ReportForm, type ReportSubmitInput } from './report-form';
import { api } from '@/lib/api-client';

/** 접수 번호로 노출할 식별자 뒷자리 길이 */
const RECEIPT_NO_LENGTH = 8;

const EXTERNAL_REPORT_URL = 'https://www.culture.go.kr/singo';

/** A7 암표·부정판매 신고 */
export default function ReportPage() {
  const [receiptNo, setReceiptNo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (input: ReportSubmitInput) => {
    if (isSubmitting) return;

    setSubmitting(true);
    setErrorMessage('');
    const result = await api.submitReport({
      targetType: input.targetType,
      reason: input.reason,
      detail: input.detail,
      evidenceUrl: input.evidenceUrl === '' ? undefined : input.evidenceUrl,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.reason);
      return;
    }
    setReceiptNo(result.data.reportId.replace(/-/g, '').slice(-RECEIPT_NO_LENGTH).toUpperCase());
  };

  return (
    <main>
      <AppHeader
        title="암표·부정판매 신고"
        description="팬이 정가로 공연을 볼 수 있도록 함께 지켜 주세요."
      />

      <div className="flex flex-col gap-3.5 px-4 pb-2">
        {receiptNo ? (
          <>
            <ReceiptNoCard receiptNo={receiptNo} />

            <div className={`${CARD} flex items-start gap-3 p-4`}>
              <ShieldIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#6B7684]" />
              <p className="text-[13.5px] leading-[1.65] text-[#4E5968]">
                접수된 신고는 관련 법령에 따라 신속히 조치되며, 필요한 경우 수사기관에 제공될 수
                있습니다.
              </p>
            </div>

            <NoticeBox tone="muted">
              정부 통합 창구에도 신고할 수 있습니다.{' '}
              <a
                href={EXTERNAL_REPORT_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#191F28] underline underline-offset-2"
              >
                문화체육관광부 암표 통합 신고 누리집 (culture.go.kr/singo)
              </a>
            </NoticeBox>

            <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#ECFDF3] px-5 py-9 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#12B76A] text-white">
                <CheckIcon className="h-7 w-7" />
              </span>
              <p className="text-[17px] font-bold text-[#067647]">신고가 접수되었습니다</p>
              <p className="text-[13.5px] leading-relaxed text-[#3E7C60]">
                신속히 확인 후 조치하겠습니다. 처리 결과는 필요 시 개별 안내드립니다.
              </p>
            </div>

            <button type="button" onClick={() => setReceiptNo('')} className={GHOST_BUTTON}>
              다른 건 추가 신고하기
            </button>
            <Link href="/app" className={`${GHOST_BUTTON} text-[#6B7684]`}>
              홈으로 이동
            </Link>
          </>
        ) : (
          <>
            <ReportForm
              busy={isSubmitting}
              serverError={errorMessage}
              onSubmit={(input) => void handleSubmit(input)}
            />
            <ReportGuideFold />
          </>
        )}
      </div>
    </main>
  );
}

/** 법령·정부 창구 안내 접힘 — 신고 진입을 막지 않도록 폼 아래에 둔다 */
function ReportGuideFold() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F4F6]">
          <ShieldIcon className="h-5 w-5 text-[#4E5968]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-[#191F28]">안내</span>
          <span className={`block text-[12.5px] ${MUTED}`}>접수 후 24시간 이내 노출 차단 등 조치</span>
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-[#8B95A1] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div className="flex flex-col gap-2.5 border-t border-[#F2F4F6] px-4 pb-4 pt-3 text-[13px] leading-[1.65] text-[#4E5968]">
          <p>접수된 신고는 관련 법령에 따라 신속히 조치되며, 필요한 경우 수사기관에 제공될 수 있습니다.</p>
          <p>
            정부 통합 창구에도 신고할 수 있습니다.{' '}
            <a
              href={EXTERNAL_REPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#191F28] underline underline-offset-2"
            >
              문화체육관광부 암표 통합 신고 누리집 (culture.go.kr/singo)
            </a>
          </p>
        </div>
      ) : null}
    </section>
  );
}

/** 접수 번호 카드 — 저장(복사)을 1탭으로 만들어 제출 직후 번호를 보존하게 한다 */
function ReceiptNoCard({ receiptNo }: { receiptNo: string }) {
  const toast = useAppToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptNo);
      toast.success('접수 번호가 복사됐어요');
    } catch {
      toast.info('복사에 실패했어요. 번호를 직접 캡처해 주세요.');
    }
  };

  return (
    <section className="rounded-2xl border border-[#E7A8BF] bg-[#FDF2F7] p-4">
      <p className="flex items-center gap-2 text-[13.5px] font-bold text-[#D6336C]">
        <ReceiptIcon className="h-5 w-5" />
        접수 번호
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className={`text-[32px] font-extrabold tracking-[0.12em] text-[#C9184A] ${NUMERIC}`}>
          {receiptNo}
        </p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="shrink-0 rounded-xl border border-[#D6336C] bg-white px-4 py-2 text-[14px] font-bold text-[#D6336C]"
        >
          복사
        </button>
      </div>
      <p className="mt-1 text-[13px] text-[#8A5B6C]">
        나중에 문의할 때 필요해요. 지금 캡처/복사해 두세요.
      </p>
    </section>
  );
}
