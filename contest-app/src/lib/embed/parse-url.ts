import type { Platform } from "../types";

export interface ParsedUrl {
  platform: Platform;
  externalId: string;
  canonicalUrl: string;
  /** URL에 작성자 계정이 포함된 플랫폼(x·tiktok·threads)에서 추출한 핸들(@ 제외). 도용 방지의 핵심 근거 */
  authorHandle?: string;
}

// 네트워크 없이 URL만으로 플랫폼 판별 + ID 추출 + canonical 정규화.
// TikTok 단축링크(vm.tiktok.com 등)는 여기서 null → 서버(resolve-url)에서 redirect 추적 후 재파싱.
export function parseEntryUrl(raw: string): ParsedUrl | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const path = u.pathname;

  // YouTube: watch?v= / youtu.be/{id} / shorts/{id}
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{6,20}$/.test(v)) return yt(v);
    const shorts = path.match(/^\/shorts\/([\w-]{6,20})/);
    if (shorts) return yt(shorts[1]);
    const embed = path.match(/^\/embed\/([\w-]{6,20})/);
    if (embed) return yt(embed[1]);
    return null;
  }
  if (host === "youtu.be") {
    const m = path.match(/^\/([\w-]{6,20})/);
    return m ? yt(m[1]) : null;
  }

  // TikTok: tiktok.com/@user/video/{id} | /photo/{id}
  if (host === "tiktok.com" || host === "m.tiktok.com") {
    const m = path.match(/^\/(@[\w.\-]+)\/(?:video|photo)\/(\d{5,25})/);
    if (!m) return null;
    return {
      platform: "tiktok",
      externalId: m[2],
      canonicalUrl: `https://www.tiktok.com/${m[1]}/video/${m[2]}`,
      authorHandle: m[1].slice(1),
    };
  }

  // X·Instagram·Threads: 업로드 제한(썸네일 미제공/불안정으로 UI 저하) → 미지원 처리.
  // 기존 게시물 렌더는 EntryEmbed가 계속 처리(Platform 타입·임베드 유지).
  return null;
}

function yt(id: string): ParsedUrl {
  return { platform: "youtube", externalId: id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` };
}

// TikTok 단축링크 판별 (서버에서 redirect 추적 대상)
export function isTiktokShortLink(raw: string): boolean {
  try {
    const host = new URL(raw.trim()).hostname.replace(/^www\./, "").toLowerCase();
    return host === "vm.tiktok.com" || host === "vt.tiktok.com";
  } catch {
    return false;
  }
}

// Instagram reel 여부 (video 콘테스트 매칭용)
export function isInstagramReel(canonicalUrl: string): boolean {
  return canonicalUrl.includes("/reel/");
}
