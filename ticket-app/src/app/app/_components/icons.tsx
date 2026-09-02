/** 회원 앱 인라인 아이콘 — 이모지 대신 사용하는 단순 선 아이콘 */

interface IconProps {
  className?: string;
}

const BASE_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function HomeIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function ReceiptIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M6 3h12v18l-3-1.8-3 1.8-3-1.8L6 21z" />
      <path d="M9.5 8.5h5M9.5 12.5h5" />
    </svg>
  );
}

export function ClockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function TicketIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 8.5V6h16v2.5a2.2 2.2 0 0 0 0 7V18H4v-2.5a2.2 2.2 0 0 0 0-7z" />
      <path d="M13 7.5v9" strokeDasharray="2 2.5" />
    </svg>
  );
}

export function DoorEnterIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M13 4h6v16h-6" />
      <path d="M4 12h9M10 8.5 13.5 12 10 15.5" />
    </svg>
  );
}

export function PostIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="4.5" y="6.5" width="12" height="13" rx="2" />
      <path d="M8 10.5h5M8 13.5h5M9.5 3.5h8a2 2 0 0 1 2 2v9" />
    </svg>
  );
}

export function UserIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function LinkIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M10.5 13.5 13.5 10.5" />
      <path d="M8.5 12 6.8 13.7a3.1 3.1 0 0 0 4.4 4.4L12.9 16.4" />
      <path d="M15.5 12l1.7-1.7a3.1 3.1 0 0 0-4.4-4.4L11.1 7.6" />
    </svg>
  );
}

export function ImageIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="9.75" r="1.5" />
      <path d="M4 16.5 9 12l3.5 3 2.5-2.2 5 4.2" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </svg>
  );
}

export function SirenIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M12 3a5 5 0 0 1 5 5v6H7V8a5 5 0 0 1 5-5z" />
      <path d="M5 17h14M5 20.5h14M12 7.5v3.5" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M5.5 9 12 15.5 18.5 9" />
    </svg>
  );
}

export function ChevronRightIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  );
}

export function CopyIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.2" />
      <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
    </svg>
  );
}

export function CheckIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  );
}

export function ShieldIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M12 3.5 19 6v5.5c0 4.2-2.8 7.6-7 9-4.2-1.4-7-4.8-7-9V6z" />
      <path d="M12 9v3.5M12 15.5h.01" />
    </svg>
  );
}
