'use client';

import {
  DEEPLINK_PLACEHOLDER,
  isDeeplinkValid,
  type Deeplink,
} from '@/types/deeplink';

interface Props {
  value: Deeplink;
  onChange: (v: Deeplink) => void;
  disabled?: boolean;
  /** 컴팩트 모드: 라벨·힌트 텍스트 생략 (좁은 영역) */
  compact?: boolean;
}

/**
 * 딥링크 입력 컴포넌트 (v2.0 — 단순화)
 *
 * - 소스 타입 드롭다운 폐지. URL 단일 텍스트박스 1개
 * - 빈 값 = 이동 없음 (표시 전용 배너 / 본문 클릭 비활성 알림)
 * - URL 형식 검증: https:// · http:// · / 중 하나로 시작해야 함
 * - [CEB-BO-013] §9 v7.9 정합
 */
export default function DeeplinkPicker({ value, onChange, disabled = false, compact = false }: Props) {
  const isValid = isDeeplinkValid(value);
  const showError = !isValid && value.url.trim().length > 0;

  const setUrl = (url: string) => onChange({ url });

  return (
    <div className={compact ? '' : 'space-y-1'}>
      <input
        type="text"
        disabled={disabled}
        value={value.url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={DEEPLINK_PLACEHOLDER}
        className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 ${
          showError ? 'border-red-300 bg-red-50' : 'border-gray-200'
        }`}
      />
      {showError && (
        <p className="text-xs text-red-600 mt-1">
          URL은 https://, http://, 또는 /로 시작해야 합니다.
        </p>
      )}
      {!compact && !showError && (
        <p className="text-xs text-gray-500 mt-1">
          비우면 이동 없음 (표시 전용). 외부 URL은 새 탭, 내부 URL은 SPA 라우팅.
        </p>
      )}
    </div>
  );
}
