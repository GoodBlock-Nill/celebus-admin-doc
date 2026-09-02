import { CARD, MUTED } from '../_components/ui';

/** 단계 카드 공통 골격 — STEP 라벨·제목·필수/선택 표기 */
export function StepCard({
  step,
  title,
  required,
  children,
}: {
  step: number;
  title: string;
  required: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`${CARD} p-4`}>
      <p className="text-[12.5px] font-bold tracking-wide text-[#D6336C]">STEP {step}</p>
      <h2 className="mt-0.5 text-[17px] font-bold text-[#191F28]">
        {title}
        <span className={`text-[13.5px] font-semibold ${required ? 'text-[#D6336C]' : MUTED}`}>
          ({required ? '필수' : '선택'})
        </span>
      </h2>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

