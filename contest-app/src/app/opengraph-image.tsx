import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// 공유 미리보기 기본 OG 이미지 (홈·기본) — 브랜드 로고 + FanStage 워드마크.
// 콘테스트 상세는 generateMetadata에서 커버 이미지로 대체된다.
export const runtime = "nodejs";
export const alt = "CELEBUS FanStage — V01D Fan Contest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  let logo = "";
  try {
    const buf = await readFile(join(process.cwd(), "public/icons/icon-512.png"));
    logo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    /* 로고 없이 렌더 */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(120% 85% at 50% 0%, #2a1a5e 0%, #0b0b0d 58%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={132} height={132} style={{ borderRadius: 30, marginBottom: 44 }} alt="" />
        ) : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontSize: 38, letterSpacing: 10, color: "#a78bfa", fontWeight: 800 }}>CELEBUS</span>
          <span style={{ fontSize: 92, fontWeight: 900, letterSpacing: -1 }}>FanStage</span>
        </div>
        <div style={{ marginTop: 26, fontSize: 34, color: "#a1a1aa", fontWeight: 500 }}>V01D Fan Contest</div>
      </div>
    ),
    { ...size },
  );
}
