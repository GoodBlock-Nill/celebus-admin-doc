"use client";

// 홈 온보딩 — "올리면 멤버가 봐준다"는 코어 루프를 귀여운 세로 여정(타임라인)으로 전달.
// 3열 그리드(정형적) 대신 위→아래로 읽는 스토리형 + 참 일러스트 부드러운 플로팅.
// forced=false: 최초 1회만(닫으면 localStorage 기억). forced=true: 빈 상태에서 항상 노출.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLang } from "./LangProvider";
import { CharmIcon, type CharmName } from "./CharmIcon";

type Step = { charm: CharmName; titleKey: string; subKey: string; tint: string; accent?: string };

const STEPS: Step[] = [
  { charm: "upload", titleKey: "hiw1_title", subKey: "hiw1_sub", tint: "from-[#efe8ff] to-[#e2d6ff]" },
  { charm: "heart", titleKey: "hiw2_title", subKey: "hiw2_sub", tint: "from-[#ffe6f1] to-[#ffd6e8]", accent: "💜" },
  { charm: "trophy", titleKey: "hiw3_title", subKey: "hiw3_sub", tint: "from-[#fff2d0] to-[#ffe3a8]", accent: "✨" },
];

export default function HowItWorks({ forced = false }: { forced?: boolean }) {
  const { t } = useLang();
  const [show, setShow] = useState(forced);

  useEffect(() => {
    if (forced) return;
    try {
      setShow(localStorage.getItem("moment_hiw_seen") !== "1");
    } catch {
      /* 스토리지 불가 시 노출 */
    }
  }, [forced]);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem("moment_hiw_seen", "1");
    } catch {
      /* noop */
    }
    setShow(false);
  }

  return (
    <div className="relative mt-1 overflow-hidden rounded-[26px] border border-[#e9deff] bg-gradient-to-b from-primary-soft/70 via-primary-soft/25 to-card p-4 shadow-[0_8px_26px_-14px_rgba(108,77,230,0.35)]">
      {/* 배경 데코 — 은은한 파스텔 블롭(플랫 방지, 귀여운 톤) */}
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#d9c8ff]/40 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-4 h-24 w-24 rounded-full bg-[#ffd6e8]/40 blur-2xl" />

      {!forced && (
        <button
          onClick={dismiss}
          aria-label={t("hiw_new_dismiss")}
          className="absolute right-1.5 top-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-primary-strong/50 transition-colors hover:bg-white/50 hover:text-primary-strong"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* 헤더 */}
      <div className="relative mb-3 flex items-center gap-1.5">
        <span className="hiw-twinkle text-[13px]" aria-hidden>
          🌟
        </span>
        <span className="text-[13.5px] font-extrabold tracking-tight text-primary-strong">{t("hiw_new_title")}</span>
      </div>

      {/* 여정 타임라인 */}
      <ol className="relative">
        {STEPS.map((st, i) => {
          const last = i === STEPS.length - 1;
          return (
            <li key={st.titleKey} className="anim-pop-in flex gap-3" style={{ animationDelay: `${i * 120}ms` }}>
              {/* 왼쪽: 참 버블 + 세로 점선 연결 */}
              <div className="relative flex flex-col items-center">
                <div className={`relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-gradient-to-br ${st.tint} shadow-[0_4px_12px_-4px_rgba(108,77,230,0.4)] ring-1 ring-white/70`}>
                  <CharmIcon name={st.charm} size={34} className="hiw-float" />
                  {st.accent && (
                    <span className="hiw-twinkle absolute -right-1 -top-1 text-[13px]" aria-hidden>
                      {st.accent}
                    </span>
                  )}
                  {/* 단계 번호 */}
                  <span className="brand-gradient absolute -bottom-1 -left-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                    {i + 1}
                  </span>
                </div>
                {!last && <div className="my-1 w-0 flex-1 border-l-2 border-dotted border-primary/30" />}
              </div>

              {/* 오른쪽: 카피 */}
              <div className={`min-w-0 flex-1 ${last ? "pt-1.5" : "pb-4 pt-1.5"}`}>
                <div className="text-[14px] font-extrabold leading-tight text-fg">{t(st.titleKey)}</div>
                <div className="mt-1 text-[12px] leading-snug text-muted break-keep">{t(st.subKey)}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
