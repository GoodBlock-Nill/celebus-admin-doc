import type { ContestType } from "./types";

// 영상/이미지 콘테스트 시각 분기의 단일 진실.
// CTA 보라는 유형과 무관하게 고정 — 여기 색은 "유형 태그" 신호에만 쓴다.
export interface ContestVisual {
  accentVar: string; // CSS 변수명 (text-video / bg-video 등 유틸로도 사용)
  accentHex: string;
  glowClass: string; // 카드 글로우
  tileAspect: string; // 미디어 타일 비율
  galleryClass: string; // 갤러리 컨테이너 레이아웃
  label: "video" | "image";
}

const VIDEO: ContestVisual = {
  accentVar: "--color-video",
  accentHex: "#7c9cff",
  glowClass: "glow-video",
  tileAspect: "aspect-video", // 16:9 시네마틱
  galleryClass: "grid grid-cols-1 gap-3 sm:grid-cols-2",
  label: "video",
};

const IMAGE: ContestVisual = {
  accentVar: "--color-image",
  accentHex: "#f0a868",
  glowClass: "glow-image",
  tileAspect: "aspect-square", // 정방형 갤러리
  galleryClass: "masonry", // Pinterest식 스태거
  label: "image",
};

export function contestVisual(type: ContestType): ContestVisual {
  return type === "video" ? VIDEO : IMAGE;
}
