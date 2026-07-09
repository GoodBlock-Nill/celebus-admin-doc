import { ImageResponse } from "next/og";

export const alt = "CELEBUS FanVoice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 링크 공유 미리보기용 브랜드 카드 (X·Threads·카카오 등). 한글 폰트 번들 이슈 회피 위해 라틴 텍스트만 사용.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1c1c28 0%, #121212 55%, #241a33 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 92, fontWeight: 900, letterSpacing: -3 }}>
          <span style={{ color: "#fafafa" }}>CELEBUS&nbsp;</span>
          <span style={{ color: "#a78bfa" }}>FanVoice</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: "#a1a1aa" }}>Share your voice with V01D</div>
        <div
          style={{
            marginTop: 56,
            display: "flex",
            height: 8,
            width: 220,
            borderRadius: 9999,
            background: "linear-gradient(90deg, #a78bfa 0%, #ec4899 100%)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
