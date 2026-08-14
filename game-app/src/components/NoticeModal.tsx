"use client";

// 홈 팝업 공지 — 관리자가 등록한 공지(이미지·제목·본문·CTA)를 홈 진입 시 순차 표시(최대 3개).
// 정책: always=매번 / daily=단순 닫기는 재노출, "오늘 하루 보지 않기"만 기록 / once=닫는 즉시 영구 숨김.
import { useRef, useState } from "react";
import { markNoticeHidden, type HomeNotice } from "@/lib/game-api";
import { pickL10n } from "@/lib/i18n";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLang } from "./LangProvider";
import { parseDeepLink, type DeepLinkScreen } from "./AppShell";

export default function NoticeModal({
  notices,
  onClose,
  onNavigate,
}: {
  notices: HomeNotice[];
  onClose: () => void;
  onNavigate?: (name: DeepLinkScreen) => void; // 내부 링크(/?screen=…) CTA의 앱 내 이동
}) {
  const { t, lang } = useLang();
  const [index, setIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const n = notices[index];
  const advance = () => {
    setImgError(false);
    if (index + 1 < notices.length) setIndex(index + 1);
    else onClose();
  };
  // 단순 닫기 — once만 즉시 기록(닫으면 다시 안 봄), daily는 기록 없이 다음 방문 재노출
  const close = () => {
    if (n.policy === "once") markNoticeHidden(n);
    advance();
  };
  const hideToday = () => {
    markNoticeHidden(n); // daily: 오늘 KST 날짜 기록
    advance();
  };
  useFocusTrap(ref, true, close);

  if (!n) return null;
  const title = pickL10n(n.title, lang);
  const body = pickL10n(n.body, lang);
  const cta = pickL10n(n.cta_label, lang);

  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-black/80 p-4">
      <div
        key={n.id} // 공지 전환 시 pop-in 재생
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("notice_aria")}
        tabIndex={-1}
        className="anim-pop-in my-auto w-full max-w-xs overflow-hidden rounded-[22px] bg-surface-2 text-center outline-none ring-1 ring-hairline"
      >
        {n.image_url && !imgError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.image_url} alt="" className="max-h-48 w-full object-cover" onError={() => setImgError(true)} />
        )}
        <div className="p-6">
          {title && <div className="text-[17px] font-black break-keep">{title}</div>}
          {body && <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted break-keep">{body}</p>}

          {cta && n.cta_url && (() => {
            // 내부 링크(/?screen=gacha 등)면 새 탭 대신 팝업을 닫고 그 화면으로 전환
            const internal = n.cta_url.startsWith("http") ? null : parseDeepLink(n.cta_url);
            if (internal && onNavigate) {
              return (
                <button
                  onClick={() => {
                    if (n.policy === "once") markNoticeHidden(n);
                    onClose();
                    onNavigate(internal);
                  }}
                  className="btn-ornate mt-4 block w-full rounded-[16px] py-3 text-[14px] font-black text-white"
                >
                  {cta}
                </button>
              );
            }
            return (
              <a
                href={n.cta_url}
                target="_blank"
                rel="noreferrer"
                className="btn-ornate mt-4 block w-full rounded-[16px] py-3 text-[14px] font-black text-white"
              >
                {cta}
              </a>
            );
          })()}

          <button onClick={close} className="mt-3 w-full rounded-full bg-primary py-3 text-[14px] font-black text-white active:scale-[0.99]">
            {t("notice_close")}
          </button>

          {n.policy === "daily" && (
            <button onClick={hideToday} className="mt-2.5 text-[12px] font-bold text-subtle underline underline-offset-2">
              {t("notice_hide_today")}
            </button>
          )}

          {/* 순차 도트 — 2개 이상일 때만 */}
          {notices.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {notices.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-primary" : "bg-white/20"}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
