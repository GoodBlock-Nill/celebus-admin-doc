import type { ReactNode } from 'react';

/**
 * 이미지 항목 전용 표시 틀.
 * 공통 입력 항목(Field)은 라벨 전체가 클릭 대상이라, 파일 선택 버튼이 두 번 열리는 것을 막기 위해
 * 이미지 항목에서는 라벨을 쓰지 않는 이 틀을 사용한다.
 */
export function MediaField({
  label,
  required = false,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  /** 검증 실패 사유 — 있으면 안내 문구 대신 빨간 문구로 보여 준다. */
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-[#4A4E5A]">
        {label}
        {required ? <span className="ml-1 text-[#C2402A]">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-[11px] font-semibold leading-relaxed text-[#C2402A]">{error}</span>
      ) : hint ? (
        <span className="text-[11px] leading-relaxed text-[#6B7080]">{hint}</span>
      ) : null}
    </div>
  );
}

/** 이미지 등록 규격 안내 — 접지 않고 항상 펼쳐 둔다(등록 전에 반드시 읽어야 하는 내용). */
export function ConcertImageGuide({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-1 rounded-lg border border-[#E3E5EA] bg-[#FAFBFC] px-3.5 py-2.5">
      {lines.map((line) => (
        <li key={line} className="text-[12px] leading-relaxed text-[#4A4E5A]">
          {line}
        </li>
      ))}
    </ul>
  );
}
