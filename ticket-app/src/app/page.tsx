'use client';

import Link from 'next/link';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

const DEMO_STEPS = [
  { title: '① 앱 — 본인확인·예매', detail: '공연 선택 → 간편인증 본인확인(모의) → 매수 선택 → 입금 안내 확인' },
  {
    title: '② BO — 입금 확인·티켓 지급',
    detail: '주문·입금 확인 메뉴에서 모의 입금 → 자동 대조 → 입금 확인(지급 대기) → 지급 대기 탭에서 티켓 지급',
  },
  { title: '③ 앱 — 티켓 지급 확인', detail: '내 티켓에서 지급 완료 티켓과 QR 활성화 조건 확인 (시간 이동으로 입장 임박 재현)' },
  { title: '④ BO — 현장 체크인', detail: '발권·체크인에서 코드 스캔 모의 → 중복 스캔 경고 확인' },
  { title: '⑤ 신고 창구', detail: '앱에서 암표 신고 접수 → BO 신고 처리 큐의 10시간 SLA 타이머·조치 흐름 확인' },
];

export default function DemoHubPage() {
  const hydrated = useHydrated();
  const users = useTicketStore((s) => s.users);
  const currentUserId = useTicketStore((s) => s.currentUserId);
  const switchUser = useTicketStore((s) => s.switchUser);
  const resetDemo = useTicketStore((s) => s.resetDemo);

  const handleReset = () => {
    if (window.confirm('데모 데이터를 초기 상태로 되돌릴까요? (주문·티켓·입금·신고 전부 삭제)')) {
      resetDemo();
    }
  };

  return (
    <main className="min-h-dvh bg-[#101116] text-[#F1F0EC] flex items-center justify-center p-6">
      <div className="w-full max-w-[720px]">
        <p className="text-[12px] tracking-[0.2em] text-[#F0426E] font-bold">CELEBUS TICKET · MVP PROTOTYPE</p>
        <h1 className="text-3xl font-bold mt-2">티켓 예매 연동 데모</h1>
        <p className="text-[#9A9AA4] mt-3 leading-relaxed">
          무통장입금 기반 1차 오픈 흐름을 회원 앱과 백오피스가 하나의 상태를 공유하며 시연합니다.
          근거 명세: v2/[CEB-TKT-001-A] 티켓 예매 서비스 기획 리포트.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link
            href="/app"
            className="rounded-2xl border border-[#2A2C34] bg-[#191A20] p-6 hover:border-[#F0426E] transition-colors"
          >
            <p className="text-2xl">📱</p>
            <p className="text-lg font-bold mt-2">회원 앱</p>
            <p className="text-sm text-[#9A9AA4] mt-1">공연 목록 · 본인확인 · 예매 · 주문내역 · 내 티켓(QR) · 신고</p>
          </Link>
          <Link
            href="/bo"
            className="rounded-2xl border border-[#2A2C34] bg-[#191A20] p-6 hover:border-[#3056D3] transition-colors"
          >
            <p className="text-2xl">🖥️</p>
            <p className="text-lg font-bold mt-2">백오피스</p>
            <p className="text-sm text-[#9A9AA4] mt-1">공연·재고 4분류 · 입금 확인 큐 · 환불 · 체크인 · 신고 처리</p>
          </Link>
        </div>

        <div className="rounded-2xl border border-[#2A2C34] bg-[#15161B] p-5 mt-6">
          <p className="text-sm font-bold text-[#F1F0EC]">권장 시연 순서</p>
          <ol className="mt-3 space-y-2">
            {DEMO_STEPS.map((step) => (
              <li key={step.title} className="text-sm leading-relaxed">
                <span className="font-semibold">{step.title}</span>
                <span className="text-[#9A9AA4]"> — {step.detail}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6 text-sm">
          <span className="text-[#9A9AA4]">데모 사용자</span>
          {hydrated ? (
            <select
              value={currentUserId}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-[#191A20] border border-[#2A2C34] rounded-lg px-3 py-2"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nickname}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[#9A9AA4]">불러오는 중…</span>
          )}
          <span className="text-[#5C5E68] text-xs">사용자를 바꿔 같은 정보로 본인확인하면 중복 가입 차단을 확인할 수 있습니다</span>
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto rounded-lg border border-[#F06548] text-[#F06548] px-3 py-2 hover:bg-[#F06548] hover:text-white transition-colors"
          >
            데모 초기화
          </button>
        </div>
      </div>
    </main>
  );
}
