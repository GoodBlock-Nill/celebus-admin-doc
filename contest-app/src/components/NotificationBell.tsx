"use client";

// 헤더 알림 벨 — 클릭 시 전용 화면(/notifications)으로 이동(ROUTE-01). 미확인 개수만 뱃지로 표시.
// 읽음 처리는 알림 화면 진입 시 수행하므로 여기서는 개수만 폴링한다.
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";

export default function NotificationBell() {
  const { t } = useLang();
  const { signedIn } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!signedIn) return; // 알림은 로그인 유저 전용
    fetch("/api/stage/notifications")
      .then((r) => r.json())
      .then((j) => setUnread(j.unread ?? 0))
      .catch(() => {});
  }, [signedIn]);

  if (!signedIn) return null;

  return (
    <Link
      href="/notifications"
      aria-label={t("noti_title")}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-fg"
    >
      <Bell className="h-[18px] w-[18px]" />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
