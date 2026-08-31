import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md';

const VARIANT_STYLE: Record<ButtonVariant, string> = {
  primary: 'border-[#3056D3] bg-[#3056D3] text-white hover:bg-[#2545A8] hover:border-[#2545A8]',
  secondary: 'border-[#C9CDD6] bg-white text-[#1B1D22] hover:bg-[#F2F3F6]',
  ghost: 'border-transparent bg-transparent text-[#3056D3] hover:bg-[#EDF1FD]',
  danger: 'border-[#C2402A] bg-white text-[#C2402A] hover:bg-[#FBEDEA]',
  success: 'border-[#188A5B] bg-[#188A5B] text-white hover:bg-[#146B47] hover:border-[#146B47]',
};

const SIZE_STYLE: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[13px]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_STYLE[variant]} ${SIZE_STYLE[size]} ${className}`}
      {...rest}
    />
  );
}

const CONTROL_CLASS =
  'w-full rounded-lg border border-[#C9CDD6] bg-white px-3 py-2 text-[13px] text-[#1B1D22] outline-none placeholder:text-[#A2A7B4] focus:border-[#3056D3] disabled:bg-[#F2F3F6] disabled:text-[#6B7080]';

export function Field({
  label,
  hint,
  required = false,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[12px] font-semibold text-[#4A4E5A]">
        {label}
        {required ? <span className="ml-1 text-[#C2402A]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-[11px] leading-relaxed text-[#6B7080]">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL_CLASS} ${className}`} {...rest} />;
}

export function NumberInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="numeric"
      className={`${CONTROL_CLASS} tabular-nums ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${CONTROL_CLASS} ${className}`} {...rest} />;
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL_CLASS} min-h-[76px] resize-y ${className}`} {...rest} />;
}
