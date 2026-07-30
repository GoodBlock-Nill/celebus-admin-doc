// 브랜드 3D 참(charm) 아이콘 — A안 선별 적용(7종).
// "크고·브랜드감 필요·상태변화 없는" 자리 전용. 그 외는 라인(lucide) 아이콘 유지.
// 에셋: /public/charm/{name}.png (256×256 RGBA, 디자이너 제작 2.5D 참)

export type CharmName =
  | "log-in" | "bell" | "image-off" | "clapperboard" | "upload" | "heart" | "trophy" | "message-circle" | "play"
  | "folder-active" | "folder-inactive";

export function CharmIcon({ name, size = 32, className = "" }: { name: CharmName; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/charm/${name}.png`}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

// 재생 버튼 — play 참을 반투명 글래스 원형에 얹어 버튼감을 준다(썸네일 위 대비 확보).
const PLAY_DIM = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-[68px] w-[68px]" } as const;
const PLAY_ICON = { sm: 24, md: 34, lg: 44 } as const;
export function PlayBadge({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-black/25 shadow-lg ring-1 ring-white/30 backdrop-blur-md ${PLAY_DIM[size]} ${className}`}
    >
      <CharmIcon name="play" size={PLAY_ICON[size]} className="translate-x-[1px] drop-shadow" />
    </span>
  );
}
