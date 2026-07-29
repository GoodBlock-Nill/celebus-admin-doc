"use client";

// 알림 전용 화면(ROUTE-01) — 헤더 벨 → /notifications 진입. 홈 피드와 분리된 독립 화면.
// 빈/하트/댓글/읽음 상태를 모두 표현하고, 진입 시 자동으로 읽음 처리한다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle } from "lucide-react";
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

export default function NotificationsView() {
  const { t } = useLang();
  const { signedIn, requireLogin } = useSession();
  const [items, setItems] = useState<Noti[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/stage/notifications")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.items ?? []);
        if ((j.unread ?? 0) > 0) void fetch("/api/stage/notifications", { method: "POST" }); // 진입 시 읽음 처리
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [signedIn]);

  function line(n: Noti): string {
    const name = n.payload.member_name ?? "";
    if (n.type === "member_heart") return t("noti_member_heart").replace("{name}", name);
    if (n.type === "member_comment") return t("noti_member_comment").replace("{name}", name);
    return t("noti_fan_comment");
  }

  return (
    <div>
      <h1 className="mb-3 flex items-center gap-2 text-[19px] font-bold text-fg">
        <Bell className="h-5 w-5 text-primary" /> {t("noti_title")}
      </h1>

      {!signedIn ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center">
          <p className="mb-4 text-[13.5px] leading-relaxed text-muted">{t("sso_gate_body")}</p>
          <button
            onClick={() => requireLogin()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-bold text-white active:scale-95"
          >
            {t("sso_gate_go")}
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card-2" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-16 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-subtle" strokeWidth={1.6} />
          <p className="text-[13.5px] text-muted">{t("noti_empty")}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((n) => {
            const isMemberNoti = n.type !== "fan_comment";
            const inner = (
              <div className={`flex items-start gap-2.5 rounded-xl px-3 py-3 ${isMemberNoti ? "bg-primary-soft" : "bg-card ring-1 ring-border"} ${n.read ? "opacity-60" : ""}`}>
                {n.type === "member_heart" ? (
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-current text-primary" />
                ) : (
                  <MessageCircle className={`mt-0.5 h-4 w-4 shrink-0 ${isMemberNoti ? "text-primary" : "text-muted"}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-bold leading-snug ${isMemberNoti ? "text-primary-strong" : "text-fg"}`}>{line(n)}</p>
                  {n.payload.post_title && <p className="mt-0.5 truncate text-[11.5px] text-muted">{n.payload.post_title}</p>}
                  {n.payload.body && <p className="mt-0.5 truncate text-[11.5px] text-muted">&ldquo;{n.payload.body}&rdquo;</p>}
                </div>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
              </div>
            );
            return n.post_id ? (
              <Link key={n.id} href={`/video/${n.post_id}?focus=${n.type === "member_heart" ? "heart" : "comment"}`} className="block">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
