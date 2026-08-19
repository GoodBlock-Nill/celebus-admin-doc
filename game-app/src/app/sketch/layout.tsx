"use client";

// /sketch 라우트 공통 레이아웃 — 언어 컨텍스트 제공 (루트 SPA와 동일한 저장 언어 사용)
import { LangProvider } from "@/components/LangProvider";

export default function SketchLayout({ children }: { children: React.ReactNode }) {
  return <LangProvider>{children}</LangProvider>;
}
