"use client";

// Home 화면 전용 프레젠테이션 원자 컴포넌트 — 썸네일, 멤버 아바타 스택, 섹션 헤더, 로딩 스켈레톤.
import Link from "next/link";
import type { MemberHeartPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

export const CATEGORY_LABEL: Record<string, string> = {
  fancam: "직캠",
  cover: "커버",
  edit: "편집",
  etc: "기타",
};

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return iso.slice(0, 10);
}

export function Thumb({ url }: { url: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-primary-soft to-primary-soft/40" />
  );
}

export function AvatarStack({
  hearts,
  size = 18,
  ring = "ring-card",
}: {
  hearts: MemberHeartPublic[];
  size?: number;
  ring?: string;
}) {
  const sorted = [...hearts].sort((a, b) => a.sort_order - b.sort_order).slice(0, 5);
  return (
    <span className="flex -space-x-1.5">
      {sorted.map((h) =>
        h.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={h.member_id}
            src={h.avatar_url}
            alt={h.display_name}
            style={{ width: size, height: size }}
            className={`rounded-full object-cover ring-2 ${ring}`}
          />
        ) : (
          <span
            key={h.member_id}
            style={{ width: size, height: size, fontSize: size * 0.44 }}
            className={`flex items-center justify-center rounded-full bg-primary-soft font-bold text-primary-strong ring-2 ${ring}`}
          >
            {h.display_name.slice(0, 1)}
          </span>
        ),
      )}
    </span>
  );
}

export function SectionHeader({ title, sub, moreHref }: { title: string; sub?: string; moreHref?: string }) {
  const { t } = useLang();
  return (
    <div className="mb-2.5 mt-7 flex items-end px-0.5">
      <div className="min-w-0">
        <h2 className="text-[16px] font-extrabold tracking-tight text-fg">{title}</h2>
        {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
      </div>
      {moreHref && (
        <Link href={moreHref} className="ml-auto flex min-h-11 shrink-0 items-center text-[12.5px] font-bold text-primary">
          {t("home_see_all")}
        </Link>
      )}
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div>
      <div className="aspect-[16/10] w-full animate-pulse rounded-3xl bg-black/[0.05]" />
      <div className="mt-7 h-[92px] w-full animate-pulse rounded-2xl bg-black/[0.05]" />
      <div className="mt-7 flex gap-2.5 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[130px] w-[156px] shrink-0 animate-pulse rounded-2xl bg-black/[0.05]" />
        ))}
      </div>
      <div className="mt-7 h-[72px] w-full animate-pulse rounded-2xl bg-black/[0.05]" />
    </div>
  );
}
