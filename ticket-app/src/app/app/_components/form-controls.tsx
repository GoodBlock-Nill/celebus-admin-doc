'use client';

import { INPUT, MUTED, NUMERIC } from './ui';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

/** 라벨 + 입력 + 안내/오류 문구 */
export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold">{label}</span>
      {children}
      {error ? (
        <span className="text-[11.5px] text-[#F06548]">{error}</span>
      ) : hint ? (
        <span className={`text-[11.5px] ${MUTED}`}>{hint}</span>
      ) : null}
    </label>
  );
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'url';
  maxLength?: number;
  numeric?: boolean;
}

/** 단일행 텍스트 입력 */
export function TextInput({
  value,
  onChange,
  placeholder,
  inputMode = 'text',
  maxLength,
  numeric = false,
}: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      inputMode={inputMode}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`${INPUT} ${numeric ? NUMERIC : ''}`}
    />
  );
}

interface QtyStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const STEPPER_BUTTON =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#2A2C34] bg-[#20222A] text-[18px] font-bold text-[#F1F0EC] disabled:text-[#5F606B]';

/** 매수 스테퍼 */
export function QtyStepper({ value, min, max, onChange }: QtyStepperProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="매수 줄이기"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={STEPPER_BUTTON}
      >
        −
      </button>
      <span className={`min-w-[52px] text-center text-[17px] font-bold ${NUMERIC}`}>{value}매</span>
      <button
        type="button"
        aria-label="매수 늘리기"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={STEPPER_BUTTON}
      >
        +
      </button>
    </div>
  );
}

interface CheckRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

/** 체크박스 한 줄 */
export function CheckRow({ checked, onChange, children }: CheckRowProps) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#F0426E]"
      />
      <span className="text-[12.5px] leading-relaxed text-[#C9C8CE]">{children}</span>
    </label>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface RadioGroupProps<T extends string> {
  /** 묶음 이름 — 입력 그룹 식별 및 읽기 도구 안내에 사용 */
  name: string;
  groupLabel: string;
  value: T;
  options: readonly RadioOption<T>[];
  onChange: (value: T) => void;
}

/** 단일 선택 목록 — 선택지가 두세 개인 분기에 사용 */
export function RadioGroup<T extends string>({
  name,
  groupLabel,
  value,
  options,
  onChange,
}: RadioGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={groupLabel} className="flex flex-col gap-2">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <label
            key={option.value}
            className={`flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition ${
              isSelected ? 'border-[#F0426E] bg-[#F0426E14]' : 'border-[#2A2C34] bg-[#20222A]'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 shrink-0 accent-[#F0426E]"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-[#F1F0EC]">{option.label}</span>
              {option.description ? (
                <span className={`text-[11.5px] ${NUMERIC} ${MUTED}`}>{option.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** 스위치 형태 토글 */
export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-3">
      <span className="text-[13px] font-semibold">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-[#F0426E]' : 'bg-[#2A2C34]'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
