"use client";

// 하단 탭 내비게이션 (Wave 3) — 홈·스테이지·＋올리기·이벤트·마이. 라우트 기반(딥링크·뒤로가기 정상).
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Plus, Trophy, User } from "lucide-react";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";
import GlobalUploadSheet from "./GlobalUploadSheet";

type Item = { href: string; key: string; icon: typeof Home; match: (p: string) => boolean };

const ITEMS: Item[] = [
  { href: "/", key: "nav_home_tab", icon: Home, match: (p) => p === "/" },
  { href: "/stages", key: "stage_tab", icon: LayoutGrid, match: (p) => p.startsWith("/stages") || p.startsWith("/stage/") },
  { href: "/events", key: "event_tab", icon: Trophy, match: (p) => p.startsWith("/events") || p.startsWith("/event/") || p.startsWith("/hearts") },
  { href: "/my", key: "nav_my_tab", icon: User, match: (p) => p.startsWith("/my") },
];

export default function BottomNav() {
  const { t } = useLang();
  const { requireLogin } = useSession();
  const pathname = usePathname() ?? "/";
  const [uploadOpen, setUploadOpen] = useState(false);

  // ＋ → 로그인 게이트(미로그인 시 로그인 후 자동 재개) → 공연 선택 시트
  const openUpload = () => {
    if (!requireLogin(() => setUploadOpen(true))) return;
    setUploadOpen(true);
  };

  return (
    <>
      <nav
        aria-label={t("nav_home_aria")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-2xl items-end justify-around px-3 pt-2">
          {/* 왼쪽 2개 */}
          {ITEMS.slice(0, 2).map((it) => (
            <TabLink key={it.href} item={it} active={it.match(pathname)} label={t(it.key)} />
          ))}

          {/* 중앙 올리기 — 공연을 골라 링크만 붙여넣으면 끝 */}
          <button onClick={openUpload} aria-label={t("nav_upload_tab")} className="mx-1 -mt-1 flex flex-col items-center">
            <span className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_8px_18px_-6px_rgba(108,77,230,0.7)] transition-transform active:scale-90">
              <Plus className="h-6 w-6" strokeWidth={2.6} />
            </span>
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
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-0.5 ${active ? "text-primary" : "text-subtle"}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors ${active ? "bg-primary-soft" : ""}`}>
        <Icon className="h-[21px] w-[21px]" strokeWidth={2} />
      </span>
      <span className="text-[9.5px] font-bold">{label}</span>
    </Link>
  );
}
