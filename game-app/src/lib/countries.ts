// 가입 전화번호 입력용 국가번호 목록 — 표기: 국기 + ISO 코드 + 번호 (언어 중립)
export type Country = { iso: string; cc: string; flag: string };

export const COUNTRIES: Country[] = [
  { iso: "KR", cc: "+82", flag: "🇰🇷" },
  { iso: "JP", cc: "+81", flag: "🇯🇵" },
  { iso: "US", cc: "+1", flag: "🇺🇸" },
  { iso: "TW", cc: "+886", flag: "🇹🇼" },
  { iso: "HK", cc: "+852", flag: "🇭🇰" },
  { iso: "CN", cc: "+86", flag: "🇨🇳" },
  { iso: "SG", cc: "+65", flag: "🇸🇬" },
  { iso: "TH", cc: "+66", flag: "🇹🇭" },
  { iso: "VN", cc: "+84", flag: "🇻🇳" },
  { iso: "PH", cc: "+63", flag: "🇵🇭" },
  { iso: "ID", cc: "+62", flag: "🇮🇩" },
  { iso: "MY", cc: "+60", flag: "🇲🇾" },
  { iso: "IN", cc: "+91", flag: "🇮🇳" },
  { iso: "AU", cc: "+61", flag: "🇦🇺" },
  { iso: "NZ", cc: "+64", flag: "🇳🇿" },
  { iso: "GB", cc: "+44", flag: "🇬🇧" },
  { iso: "FR", cc: "+33", flag: "🇫🇷" },
  { iso: "DE", cc: "+49", flag: "🇩🇪" },
  { iso: "ES", cc: "+34", flag: "🇪🇸" },
  { iso: "IT", cc: "+39", flag: "🇮🇹" },
  { iso: "NL", cc: "+31", flag: "🇳🇱" },
  { iso: "BR", cc: "+55", flag: "🇧🇷" },
  { iso: "MX", cc: "+52", flag: "🇲🇽" },
  { iso: "CA", cc: "+1", flag: "🇨🇦" },
  { iso: "AE", cc: "+971", flag: "🇦🇪" },
  { iso: "SA", cc: "+966", flag: "🇸🇦" },
  { iso: "TR", cc: "+90", flag: "🇹🇷" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // KR
