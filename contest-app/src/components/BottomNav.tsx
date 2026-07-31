"use client";

// 하단 탭 내비게이션 — 홈·아카이브·＋올리기·이벤트·마이. 라우트 기반(딥링크·뒤로가기 정상).
// 아이콘: CELEBUS MOMENT 브랜드 3D 아이콘(풀컬러 PNG). 활성=풀컬러, 비활성=디밍 + 라벨 색상으로 상태 표현.
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";
import GlobalUploadSheet from "./GlobalUploadSheet";

type Item = { href: string; key: string; icon: string; match: (p: string) => boolean };

const ITEMS: Item[] = [
  { href: "/", key: "nav_home_tab", icon: "/nav/Home.png", match: (p) => p === "/" },
  { href: "/stages", key: "stage_tab", icon: "/nav/Archive.png", match: (p) => p.startsWith("/stages") || p.startsWith("/stage/") },
  { href: "/events", key: "event_tab", icon: "/nav/Event.png", match: (p) => p.startsWith("/events") || p.startsWith("/event/") || p.startsWith("/hearts") },
  { href: "/my", key: "nav_my_tab", icon: "/nav/My.png", match: (p) => p.startsWith("/my") },
];

export default function BottomNav() {
  const { t } = useLang();
  const { requireLogin } = useSession();
  const pathname = usePathname() ?? "/";
  const [uploadOpen, setUploadOpen] = useState(false);

  // ＋ → 로그인 게이트(미로그인 시 로그인 후 자동 재개) → 아카이브 선택 시트
  const openUpload = () => {
    if (!requireLogin(() => setUploadOpen(true))) return;
    setUploadOpen(true);
  };

  return (
    <>
      <nav
        aria-label={t("nav_home_aria")}
        className="z-30 shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-2xl items-end justify-around px-3 pt-2">
          {/* 왼쪽 2개 */}
          {ITEMS.slice(0, 2).map((it) => (
            <TabLink key={it.href} item={it} active={it.match(pathname)} label={t(it.key)} />
          ))}

          {/* 중앙 올리기 — 브랜드 업로드 아이콘을 살짝 띄운 FAB로. 다른 탭과 같은 [아이콘+라벨] 리듬 정렬 */}
          <button onClick={openUpload} aria-label={t("nav_upload_tab")} className="flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nav/Upload.png" alt="" className="-mt-3 h-12 w-12 object-contain drop-shadow-[0_8px_14px_rgba(108,77,230,0.35)] transition-transform active:scale-90" />
            <span aria-hidden className="text-[9.5px] font-bold opacity-0">＋</span>
          </button>

          {/* 오른쪽 2개 */}
          {ITEMS.slice(2).map((it) => (
            <TabLink key={it.href} item={it} active={it.match(pathname)} label={t(it.key)} />
          ))}
        </div>
      </nav>
      {uploadOpen && <GlobalUploadSheet onClose={() => setUploadOpen(false)} />}
    </>
  );
}

function TabLink({ item, active, label }: { item: Item; active: boolean; label: string }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-0.5"
    >
      <span className="flex h-8 w-8 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.icon}
          alt=""
          className={`h-[26px] w-[26px] object-contain transition-all ${active ? "opacity-100" : "opacity-50 grayscale"}`}
        />
      </span>
      <span className={`text-[9.5px] font-bold ${active ? "text-primary" : "text-subtle"}`}>{label}</span>
    </Link>
  );
}
