"use client";

// 관리자 이미지 등록 시 "앱에서 이렇게 보여요" 미리보기 — 실제 앱 표시 스타일을 축약 재현.
import { CharmIcon } from "../CharmIcon";

// 아카이브 카드 미리보기 (앱 StageList 카드 스타일)
export function CoverCardPreview({ coverUrl, title, description }: { coverUrl: string; title: string; description: string }) {
  return (
    <div className="w-[220px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative h-[112px] w-full overflow-hidden bg-surface-2">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary-soft via-primary-soft/60 to-transparent">
            <CharmIcon name="clapperboard" size={34} />
            <span className="text-[10px] font-semibold text-primary-strong/70">대표 이미지 없음</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-[13px] font-bold leading-snug text-fg">{title.trim() || "아카이브 제목"}</div>
        {description.trim() && <div className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{description}</div>}
      </div>
    </div>
  );
}

// 멤버 아바타 미리보기 (앱 댓글·하트에서의 원형 아바타 + 이름)
export function AvatarPreview({ avatarUrl, name }: { avatarUrl: string; name: string }) {
  const initial = (name.trim() || "?").slice(0, 1);
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-primary/30" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[15px] font-bold text-primary-strong ring-2 ring-primary/20">
          {initial}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] font-bold text-fg">{name.trim() || "멤버 이름"}</span>
          <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] font-extrabold text-primary-strong">멤버</span>
        </div>
        <div className="text-[11px] text-subtle">앱에서 이렇게 보여요</div>
      </div>
    </div>
  );
}
