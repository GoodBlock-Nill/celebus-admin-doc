import type { Metadata } from "next";

// 내부 운영 도구 — 검색 노출 차단
export const metadata: Metadata = {
  title: "CELEB MATCH 관리",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
