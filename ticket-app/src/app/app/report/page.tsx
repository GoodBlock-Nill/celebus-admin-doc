'use client';

import Link from 'next/link';
import { useState } from 'react';

import { CheckIcon, ShieldIcon } from '../_components/icons';
import { NoticeBox, SectionCard } from '../_components/section';
import { PageSkeleton } from '../_components/feedback';
import { GHOST_BUTTON, MUTED, NUMERIC } from '../_components/ui';
import { ReportForm, type ReportSubmitInput } from './report-form';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

/** 접수 번호로 노출할 식별자 뒷자리 길이 */
const RECEIPT_NO_LENGTH = 8;

const EXTERNAL_REPORT_URL = 'https://www.culture.go.kr/singo';

/** A7 암표·부정판매 신고 */
export default function ReportPage() {
  const isHydrated = useHydrated();
  const submitReport = useTicketStore((state) => state.submitReport);

  const [receiptNo, setReceiptNo] = useState('');

  const handleSubmit = (input: ReportSubmitInput) => {
    const result = submitReport({
      targetType: input.targetType,
      reason: input.reason,
      detail: input.detail,
      evidenceUrl: input.evidenceUrl === '' ? undefined : input.evidenceUrl,
      source: '앱 신고',
    });
    setReceiptNo(result.report.id.slice(-RECEIPT_NO_LENGTH).toUpperCase());
  };

  return (
    <main>
      <header className="px-4 pb-3 pt-6">
        <h1 className="text-[20px] font-extrabold">암표·부정판매 신고</h1>
        <p className={`mt-1 text-[12.5px] ${MUTED}`}>
          팬이 정가로 공연을 볼 수 있도록 함께 지켜 주세요.
        </p>
      </header>

      <div className="flex flex-col gap-3.5 px-4 pb-6">
        <div className="flex items-start gap-3 rounded-2xl border border-[#F0426E55] bg-[#F0426E14] p-4">
          <ShieldIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#F0426E]" />
          <p className="text-[12.5px] leading-relaxed text-[#F2C4D2]">
            접수된 신고는 관련 법령에 따라 신속히 조치되며, 필요한 경우 수사기관에 제공될 수 있습니다.
          </p>
        </div>

        <NoticeBox tone="muted">
          정부 통합 창구에도 신고할 수 있습니다.{' '}
          <a
            href={EXTERNAL_REPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#F1F0EC] underline underline-offset-2"
          >
            문화체육관광부 암표 통합 신고 누리집 (culture.go.kr/singo)
          </a>
        </NoticeBox>

        {!isHydrated ? (
          <PageSkeleton rows={2} />
        ) : receiptNo ? (
          <>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#3DC98A55] bg-[#3DC98A14] px-5 py-9 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3DC98A] text-[#0F1014]">
                <CheckIcon className="h-7 w-7" />
              </span>
              <p className="text-[17px] font-extrabold text-[#3DC98A]">신고가 접수되었습니다</p>
              <p className="text-[12.5px] leading-relaxed text-[#9CC9B6]">
                신속히 확인 후 조치하겠습니다. 처리 결과는 필요 시 개별 안내드립니다.
              </p>
            </div>

            <SectionCard title="접수 번호">
              <p className={`text-[18px] font-extrabold ${NUMERIC}`}>{receiptNo}</p>
              <p className={`mt-1 text-[11.5px] ${MUTED}`}>
                문의 시 접수 번호를 알려 주시면 빠르게 확인할 수 있습니다.
              </p>
            </SectionCard>

            <button type="button" onClick={() => setReceiptNo('')} className={GHOST_BUTTON}>
              다른 건 추가 신고하기
            </button>
            <Link href="/app" className={`${GHOST_BUTTON} text-[#9A9AA4]`}>
              홈으로 이동
            </Link>
          </>
        ) : (
          <ReportForm onSubmit={handleSubmit} />
        )}
      </div>
    </main>
  );
}
