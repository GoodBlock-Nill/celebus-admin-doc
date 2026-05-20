'use client';

import {
  SOURCE_TYPE_PLACEHOLDER,
  URL_PLACEHOLDER,
  isUrlValid,
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
 * 딥링크 입력 컴포넌트 (v2.1)
 *
 * - 소스 타입 + URL 2개 자유 텍스트박스 (드롭다운·ID 검색 폐지)
 * - URL 빈 값 = 이동 없음 (표시 전용 배너 / 본문 클릭 비활성 알림)
 * - URL 형식 검증: https:// · http:// · / 중 하나로 시작
 * - [CEB-BO-013] §9 v7.10 정합
 */
export default function DeeplinkPicker({ value, onChange, disabled = false, compact = false }: Props) {
  const urlValid = isUrlValid(value.url);
  const showUrlError = !urlValid && value.url.trim().length > 0;

  const setSourceType = (sourceType: string) => onChange({ ...value, sourceType });
  const setUrl = (url: string) => onChange({ ...value, url });

  return (
    <div className={compact ? 'flex gap-3' : 'space-y-3'}>
      <div className={compact ? 'w-40 shrink-0' : ''}>
        {!compact && (
          <label className="block text-xs font-medium text-gray-600 mb-1">소스 타입</label>
        )}
        <input
          type="text"
          disabled={disabled}
          value={value.sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          placeholder={SOURCE_TYPE_PLACEHOLDER}
          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
        />
      </div>
      <div className={compact ? 'flex-1' : ''}>
        {!compact && (
          <label className="block text-xs font-medium text-gray-600 mb-1">링크 URL</label>
        )}
        <input
          type="text"
          disabled={disabled}
          value={value.url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={URL_PLACEHOLDER}
          className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 ${
            showUrlError ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
        {showUrlError && (
          <p className="text-xs text-red-600 mt-1">
            URL은 https://, http://, 또는 /로 시작해야 합니다.
          </p>
        )}
        {!compact && !showUrlError && (
          <p className="text-xs text-gray-500 mt-1">
            URL을 비우면 이동 없음 (표시 전용). 외부 URL은 새 탭, 내부 URL은 SPA 라우팅.
          </p>
        )}
      </div>
    </div>
  );
}
