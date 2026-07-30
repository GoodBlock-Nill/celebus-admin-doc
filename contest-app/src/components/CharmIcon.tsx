// 브랜드 3D 참(charm) 아이콘 — A안 선별 적용(7종).
// "크고·브랜드감 필요·상태변화 없는" 자리 전용. 그 외는 라인(lucide) 아이콘 유지.
// 에셋: /public/charm/{name}.png (256×256 RGBA, 디자이너 제작 2.5D 참)

export type CharmName = "log-in" | "bell" | "image-off" | "clapperboard" | "upload" | "heart" | "trophy" | "message-circle" | "play";

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
