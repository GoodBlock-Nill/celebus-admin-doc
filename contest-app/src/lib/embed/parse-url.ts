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

  // X: x.com|twitter.com/{user}/status/{id}
  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
    // 트윗 ID는 1자리부터 존재 (초기 트윗 예: id 20)
    const m = path.match(/^\/([\w]{1,15})\/status\/(\d{1,25})/);
    if (!m) return null;
    return {
      platform: "x",
      externalId: m[2],
      canonicalUrl: `https://x.com/${m[1]}/status/${m[2]}`,
      authorHandle: m[1],
    };
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

  // Instagram: instagram.com/(p|reel|tv)/{code}
  if (host === "instagram.com") {
    const m = path.match(/^\/(?:[\w.\-]+\/)?(p|reel|reels|tv)\/([\w-]{5,20})/);
    if (!m) return null;
    const kind = m[1] === "reels" ? "reel" : m[1];
    return {
      platform: "instagram",
      externalId: m[2],
      canonicalUrl: `https://www.instagram.com/${kind}/${m[2]}/`,
    };
  }

  // Threads: threads.net|threads.com/@user/post/{code}
  if (host === "threads.net" || host === "threads.com") {
    const m = path.match(/^\/(@[\w.\-]+)\/post\/([\w-]{5,20})/);
    if (!m) return null;
    return {
      platform: "threads",
      externalId: m[2],
      canonicalUrl: `https://www.threads.com/${m[1]}/post/${m[2]}`,
      authorHandle: m[1].slice(1),
    };
  }

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
