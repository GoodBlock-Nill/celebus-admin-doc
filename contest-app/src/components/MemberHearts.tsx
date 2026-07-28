"use client";

// 멤버 하트 표시 — 인스타 문법: 멤버 프로필 서클(스택) + "OO 님이 좋아합니다".
import { Heart } from "lucide-react";
import type { MemberHeartPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

function MemberAvatar({ heart, size }: { heart: MemberHeartPublic; size: number }) {
  return heart.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={heart.avatar_url}
      alt={heart.display_name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover ring-2 ring-card"
    />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="flex items-center justify-center rounded-full bg-primary-soft font-bold text-primary-strong ring-2 ring-card"
    >
      {heart.display_name.slice(0, 1)}
    </span>
  );
}

// 카드용 컴팩트 스택 (썸네일 위 오버레이 — 미디어가 어두워 대비 위해 어두운 칩 유지)
export function MemberHeartStack({ hearts }: { hearts: MemberHeartPublic[] }) {
  if (hearts.length === 0) return null;
  const shown = hearts.slice(0, 3);
  return (
    <span className="flex items-center gap-1 rounded-full bg-black/55 py-0.5 pl-1 pr-2 backdrop-blur-sm">
      <span className="flex -space-x-1.5">
        {shown.map((h) => (
          <MemberAvatar key={h.member_id} heart={h} size={18} />
        ))}
      </span>
      <Heart className="h-3 w-3 fill-current text-primary-400" />
    </span>
  );
}

// 상세용 풀 라인 ("주연 님 외 2명의 멤버가 좋아합니다 💜") — 은은한 브랜드 칩, 광택/그라데 없음
export function MemberHeartsLine({ hearts }: { hearts: MemberHeartPublic[] }) {
  const { t } = useLang();
  if (hearts.length === 0) return null;
  const sorted = [...hearts].sort((a, b) => a.sort_order - b.sort_order);
  const text =
    sorted.length === 1
      ? t("mh_likes_one").replace("{name}", sorted[0].display_name)
      : t("mh_likes_many").replace("{name}", sorted[0].display_name).replace("{n}", String(sorted.length - 1));
  return (
    <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2.5">
      <span className="flex -space-x-2">
        {sorted.slice(0, 5).map((h) => (
          <MemberAvatar key={h.member_id} heart={h} size={26} />
        ))}
      </span>
      <span className="min-w-0 flex-1 text-[12.5px] font-bold leading-snug text-primary-strong">{text}</span>
    </div>
  );
}
