// slug 자동 생성 — 공개 URL(/contest/[slug])용 식별자.
// 한글 제목 로마자화는 불안정하므로 아티스트+유형+짧은 랜덤으로 안정 생성.
export function deriveSlug(artist: string, type: string): string {
  const base =
    (artist || "contest")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "contest";
  const rand = Math.random().toString(36).slice(2, 8); // 6자 base36
  return `${base}-${type}-${rand}`.slice(0, 60);
}
