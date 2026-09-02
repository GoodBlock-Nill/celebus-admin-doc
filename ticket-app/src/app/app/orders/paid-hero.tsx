import { CheckIcon, ClockIcon, DoorEnterIcon, TicketIcon } from '../_components/icons';
import { TicketPerforation } from '../_components/perforation';
import { CARD } from '../_components/ui';
import { CELEBUS_APP_URL } from '@/lib/constants';

/** 지급 완료 히어로 배경의 콘페티 조각 — 장식용 고정 배치 */
const CONFETTI = [
  { left: '18%', top: '18%', rotate: '20deg', color: '#F1929F' },
  { left: '26%', top: '38%', rotate: '-15deg', color: '#F6C6DA' },
  { left: '72%', top: '16%', rotate: '35deg', color: '#F1929F' },
  { left: '80%', top: '36%', rotate: '-25deg', color: '#F6C6DA' },
] as const;

/**
 * 티켓 지급 완료 히어로 — 최종 성공을 시각적으로 선언하고
 * 다음 행동(CELEBUS 앱 발권)을 같은 카드 안에서 바로 잇는다.
 */
export function PaidHero() {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="relative bg-gradient-to-b from-[#FBE4EE] to-[#FDF4F8] px-4 pb-4 pt-8 text-center">
        {CONFETTI.map((piece) => (
          <span
            key={`${piece.left}-${piece.top}`}
            aria-hidden="true"
            className="absolute h-2 w-2 rounded-[2px]"
            style={{
              left: piece.left,
              top: piece.top,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate})`,
            }}
          />
        ))}
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D6336C]">
          <CheckIcon className="h-8 w-8 text-white" />
        </span>
        <h2 className="mt-4 text-[24px] font-bold text-[#C9184A]">티켓 지급 완료</h2>
        <p className="mt-1.5 text-[14.5px] text-[#4E5968]">
          공연 당일, CELEBUS 앱에서 QR로 입장하세요.
        </p>
        <TicketPerforation className="mt-5" />
      </div>
      <div className="px-4 pb-4 pt-1">
        <a
          href={CELEBUS_APP_URL}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#D6336C] px-4 text-[15px] font-bold text-white"
        >
          CELEBUS 앱에서 티켓 확인
        </a>
      </div>
    </section>
  );
}

const ENTRY_STEPS = [
  { icon: TicketIcon, title: '공연 당일', description: 'CELEBUS 앱을 실행하세요.' },
  {
    icon: ClockIcon,
    title: '입장 시작 시간 확인',
    description: '입장 시작 시간에 맞춰 여유 있게 도착하세요.',
  },
  {
    icon: DoorEnterIcon,
    title: 'QR로 간편 입장',
    description: '마이페이지 또는 티켓에서 QR을 제시하고 입장하세요.',
  },
] as const;

/** 입장 안내 — 공연 당일 해야 할 일을 순서 있는 3단계로 보여준다 */
export function EntryGuideCard() {
  return (
    <section className={`${CARD} p-4`}>
      <h2 className="text-[16px] font-bold text-[#191F28]">입장 안내</h2>
      <ol className="mt-3.5">
        {ENTRY_STEPS.map((step, index) => (
          <li key={step.title} className="relative flex gap-3.5 pb-5 last:pb-0">
            {index < ENTRY_STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-[21px] top-11 h-[calc(100%-44px)] w-[2px] bg-[#D6336C]"
              />
            ) : null}
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D6336C]">
              <step.icon className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[15.5px] font-bold text-[#191F28]">{step.title}</p>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-[#6B7684]">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
