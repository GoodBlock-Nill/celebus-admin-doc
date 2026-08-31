import Link from 'next/link';

const ENTRIES = [
  {
    href: '/app',
    icon: '📱',
    title: '회원 앱',
    description: '공연 목록 · 본인확인 · 예매 · 주문내역 · 내 티켓(QR) · 부정 거래 신고',
    hoverClass: 'hover:border-[#F0426E]',
  },
  {
    href: '/admin',
    icon: '🖥️',
    title: '관리자',
    description: '공연·재고 4분류 · 입금 확인 큐 · 취소·환불 · 발권·체크인 · 신고 처리 · 활동 로그',
    hoverClass: 'hover:border-[#3056D3]',
  },
];

/** 진입 안내 화면 — 회원 앱과 관리자 영역으로 나눠 들어간다. */
export default function LandingPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#101116] p-6 text-[#F1F0EC]">
      <div className="w-full max-w-[720px]">
        <p className="text-[12px] font-bold tracking-[0.2em] text-[#F0426E]">CELEBUS TICKET</p>
        <h1 className="mt-2 text-3xl font-bold">티켓 예매</h1>
        <p className="mt-3 leading-relaxed text-[#9A9AA4]">
          무통장입금 기반 실명 티켓 예매 서비스입니다. 회원 예매는 CELEBUS 계정으로,
          운영 처리는 관리자 로그인 후 이용해 주세요.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ENTRIES.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className={`rounded-2xl border border-[#2A2C34] bg-[#191A20] p-6 transition-colors ${entry.hoverClass}`}
            >
              <p className="text-2xl">{entry.icon}</p>
              <p className="mt-2 text-lg font-bold">{entry.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#9A9AA4]">{entry.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
