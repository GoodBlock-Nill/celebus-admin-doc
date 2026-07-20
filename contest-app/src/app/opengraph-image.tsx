import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// 공유 미리보기 기본 OG 이미지 (홈·기본) — 지정 디자인(fanstage_og.svg) 풀블리드.
// 콘테스트 상세는 generateMetadata에서 커버 이미지로 대체된다.
export const runtime = "nodejs";
export const alt = "CELEBUS FanStage — V01D Fan Contest";
export const size = { width: 1200, height: 675 }; // fanstage_og.svg 비율(3740×2104 ≈ 16:9)
export const contentType = "image/png";

export default async function OpengraphImage() {
  const buf = await readFile(join(process.cwd(), "public/fanstage_og.svg"));
  const src = `data:image/svg+xml;base64,${buf.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0b0d" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={size.width} height={size.height} alt="" />
      </div>
    ),
    { ...size },
  );
}
