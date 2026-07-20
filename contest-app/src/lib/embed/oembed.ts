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

// ── X(트윗) 이미지: 무인증 syndication API (react-tweet 방식) ──
// 토큰은 트윗 ID로부터 결정론적으로 계산 — 약한 검증용
function tweetToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, "");
}

async function fetchTweetThumb(id: string): Promise<string | undefined> {
  if (!/^\d+$/.test(id)) return undefined;
  const data = await fetchJson(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${tweetToken(id)}&lang=en`);
  if (!data) return undefined;
  // 사진: photos[].url / 영상·GIF 포함 미디어: mediaDetails[].media_url_https
  const photos = data.photos as Array<{ url?: string }> | undefined;
  if (Array.isArray(photos) && typeof photos[0]?.url === "string") return photos[0].url;
  const md = data.mediaDetails as Array<{ media_url_https?: string }> | undefined;
  if (Array.isArray(md) && typeof md[0]?.media_url_https === "string") return md[0].media_url_https;
  return undefined;
}

// 최소 HTML 엔티티 디코드 (og:image URL의 &amp; 등)
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// ── og:image 서버 추출 (Meta 권고 방식 — IG oEmbed 썸네일 폐지 대응) ──
// 공개 게시물 HTML의 og:image / twitter:image / og:title 파싱. 데이터센터 IP 차단 시 소프트 실패.
async function fetchOgImage(url: string): Promise<OembedMeta | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 500_000);
    const meta: OembedMeta = {};
    const img =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (img) meta.thumbnail_url = decodeEntities(img[1]);
    const title = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (title) meta.title = decodeEntities(title[1]).slice(0, 200);
    return meta.thumbnail_url ? meta : null;
  } catch {
    return null;
  }
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
    case "x": {
      // 제목·작성자는 공개 oEmbed, 썸네일은 syndication(무인증) → og:image 순으로 확보
      const meta: OembedMeta = pick(await fetchJson(`https://publish.twitter.com/oembed?url=${enc}&omit_script=true`)) ?? {};
      if (!meta.thumbnail_url) meta.thumbnail_url = await fetchTweetThumb(parsed.externalId);
      if (!meta.thumbnail_url) {
        const og = await fetchOgImage(parsed.canonicalUrl);
        if (og?.thumbnail_url) meta.thumbnail_url = og.thumbnail_url;
      }
      return Object.keys(meta).length ? meta : null;
    }
    case "tiktok":
      return pick(await fetchJson(`https://www.tiktok.com/oembed?url=${enc}`));
    // Instagram/Threads: oEmbed 썸네일 폐지(2025.11) + 서버 요청엔 og:image 미제공(JS 앱 셸, 실측 확인)
    // → 썸네일 확보 불가, 리스트는 플랫폼 아이콘 폴백. (상세는 embed.js로 렌더)
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
