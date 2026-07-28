"use client";

// 인앱 알림 벨 — "주연 님이 회원님의 영상에 하트를 남겼어요 💜"가 도착하는 곳.
import { useEffect, useState } from "react";
import { Bell, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";

type Noti = {
  id: string;
  type: "member_heart" | "member_comment" | "fan_comment";
  post_id: string | null;
  payload: { member_name?: string; post_title?: string; body?: string };
  read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const { t } = useLang();
  const { signedIn } = useSession();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Noti[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!signedIn) return; // 알림은 로그인 유저 전용
    fetch("/api/stage/notifications")
      .then((r) => r.json())
      .then((j) => {
        setUnread(j.unread ?? 0);
        setItems(j.items ?? []);
      })
      .catch(() => {});
  }, [signedIn]);

  if (!signedIn) return null;

  function openSheet() {
    setOpen(true);
    if (unread > 0) {
      setUnread(0);
      void fetch("/api/stage/notifications", { method: "POST" });
    }
  }

  function line(n: Noti): string {
    const name = n.payload.member_name ?? "";
    if (n.type === "member_heart") return t("noti_member_heart").replace("{name}", name);
    if (n.type === "member_comment") return t("noti_member_comment").replace("{name}", name);
    return t("noti_fan_comment");
  }

  return (
    <>
      <button onClick={openSheet} aria-label={t("noti_title")} className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted hover:text-fg">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-backdrop-in fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("noti_title")}
            className="max-h-[70dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:ring-1 sm:ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-[15px] font-bold text-fg">{t("noti_title")}</h2>
            {items.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-subtle">{t("noti_empty")}</p>
            ) : (
              <div className="space-y-1">
                {items.map((n) => {
                  const isMemberNoti = n.type !== "fan_comment";
                  const inner = (
                    <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${isMemberNoti ? "bg-primary-soft" : "bg-surface-2"} ${n.read ? "opacity-60" : ""}`}>
                      {n.type === "member_heart" ? (
                        <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-current text-primary" />
                      ) : (
                        <MessageCircle className={`mt-0.5 h-4 w-4 shrink-0 ${isMemberNoti ? "text-primary" : "text-subtle"}`} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-bold leading-snug ${isMemberNoti ? "text-primary-strong" : "text-fg"}`}>{line(n)}</p>
                        {n.payload.post_title && <p className="mt-0.5 truncate text-[11.5px] text-subtle">{n.payload.post_title}</p>}
                        {n.payload.body && <p className="mt-0.5 truncate text-[11.5px] text-muted">&ldquo;{n.payload.body}&rdquo;</p>}
                      </div>
                    </div>
                  );
                  return n.post_id ? (
                    <Link key={n.id} href={`/stage-post/${n.post_id}`} onClick={() => setOpen(false)} className="block">
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id}>{inner}</div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
