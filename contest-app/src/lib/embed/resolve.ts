// 서버 전용: URL → 파싱(단축링크 포함) → 콘테스트 유형 매칭 → oEmbed 메타
import type { ContestType } from "../types";
import { parseEntryUrl, isTiktokShortLink, isInstagramReel, type ParsedUrl } from "./parse-url";
import { fetchOembed, resolveTiktokShortLink, type OembedMeta } from "./oembed";

export type ResolveErrorCode = "invalid" | "wrong_type_video" | "wrong_type_image";

export type ResolveResult =
  | {
      ok: true;
      parsed: ParsedUrl;
      oembed: OembedMeta | null;
      /** 링크에서 확인된 작성자 핸들 — 있으면 출품 핸들로 강제 사용(도용 방지). null이면 수동 입력 + 미인증 플래그 */
      authorHandle: string | null;
    }
  | { ok: false; code: ResolveErrorCode };

// 콘테스트 유형별 허용 플랫폼: video = 영상 매체, image = 게시물 매체
function matchesType(parsed: ParsedUrl, type: ContestType): boolean {
  if (type === "video") {
    if (parsed.platform === "youtube" || parsed.platform === "tiktok") return true;
    if (parsed.platform === "instagram") return isInstagramReel(parsed.canonicalUrl);
    return false;
  }
  // image
  if (parsed.platform === "x" || parsed.platform === "threads") return true;
  if (parsed.platform === "instagram") return !isInstagramReel(parsed.canonicalUrl);
  return false;
}

export async function resolveEntryUrl(raw: string, contestType: ContestType): Promise<ResolveResult> {
  let parsed = parseEntryUrl(raw);
  if (!parsed && isTiktokShortLink(raw)) {
    parsed = await resolveTiktokShortLink(raw);
  }
  if (!parsed) return { ok: false, code: "invalid" };
  if (!matchesType(parsed, contestType)) {
    return { ok: false, code: contestType === "video" ? "wrong_type_video" : "wrong_type_image" };
  }
  return finalize(parsed);
}

// 스테이지 업로드용 — 유형 게이트 없음(전 플랫폼·전 형식 허용). 파싱·oEmbed 흐름은 동일.
export async function resolveStageUrl(raw: string): Promise<ResolveResult> {
  let parsed = parseEntryUrl(raw);
  if (!parsed && isTiktokShortLink(raw)) {
    parsed = await resolveTiktokShortLink(raw);
  }
  if (!parsed) return { ok: false, code: "invalid" };
  return finalize(parsed);
}

async function finalize(parsed: ParsedUrl): Promise<ResolveResult> {
  const oembed = await fetchOembed(parsed);
  // 작성자 핸들 확정: URL 내장(x·tiktok·threads) → YouTube는 oEmbed author_url(youtube.com/@handle)에서 추출
  let authorHandle: string | null = parsed.authorHandle ?? null;
  if (!authorHandle && parsed.platform === "youtube" && oembed?.author_url) {
    const m = oembed.author_url.match(/youtube\.com\/@([\w.\-%]+)/);
    if (m) authorHandle = decodeURIComponent(m[1]);
  }
  return { ok: true, parsed, oembed, authorHandle };
}
