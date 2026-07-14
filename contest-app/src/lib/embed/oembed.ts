// 무토큰 공개 oEmbed로 게시물 실존 검증 + 메타 수집 (서버 전용)
// 실패는 소프트 실패 — 파싱이 성공했으면 출품은 허용하고 메타만 비운다.
import type { ParsedUrl } from "./parse-url";
import { parseEntryUrl } from "./parse-url";

export interface OembedMeta {
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
  author_url?: string; // YouTube 채널 핸들 추출용 (공개 뷰에는 노출되지 않음)
}

const TIMEOUT_MS = 5000;

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; FanStageBot/1.0)" },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pick(data: Record<string, unknown> | null): OembedMeta | null {
  if (!data) return null;
  const meta: OembedMeta = {};
  if (typeof data.thumbnail_url === "string") meta.thumbnail_url = data.thumbnail_url;
  if (typeof data.title === "string") meta.title = data.title.slice(0, 200);
  if (typeof data.author_name === "string") meta.author_name = data.author_name.slice(0, 100);
  if (typeof data.author_url === "string") meta.author_url = data.author_url.slice(0, 200);
  return Object.keys(meta).length ? meta : null;
}

// 반환: { exists, meta } — exists=false는 "확실히 없음"(404 등이 아니라 fetch 실패일 수도 있어 소프트 처리)
export async function fetchOembed(parsed: ParsedUrl): Promise<OembedMeta | null> {
  const enc = encodeURIComponent(parsed.canonicalUrl);
  switch (parsed.platform) {
    case "youtube": {
      const data = await fetchJson(`https://www.youtube.com/oembed?url=${enc}&format=json`);
      const meta = pick(data);
      // YouTube 썸네일은 oEmbed 실패해도 규칙적으로 구성 가능
      if (!meta?.thumbnail_url) {
        return { ...meta, thumbnail_url: `https://i.ytimg.com/vi/${parsed.externalId}/hqdefault.jpg` };
      }
      return meta;
    }
    case "x":
      return pick(await fetchJson(`https://publish.twitter.com/oembed?url=${enc}&omit_script=true`));
    case "tiktok":
      return pick(await fetchJson(`https://www.tiktok.com/oembed?url=${enc}`));
    // Instagram/Threads oEmbed는 Meta 앱 토큰 필요 — 파일럿에서는 메타 없이 통과
    case "instagram":
    case "threads":
      return null;
  }
}

// TikTok 단축링크(vm/vt.tiktok.com) redirect 추적 → 최종 URL 재파싱 (SSRF 방지: 최종 호스트 검증)
export async function resolveTiktokShortLink(raw: string): Promise<ParsedUrl | null> {
  try {
    const res = await fetch(raw, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; FanStageBot/1.0)" },
    });
    const finalUrl = res.url;
    if (!finalUrl) return null;
    const host = new URL(finalUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "tiktok.com" && host !== "m.tiktok.com") return null;
    return parseEntryUrl(finalUrl);
  } catch {
    return null;
  }
}
