"use client";

// 몰입 피드의 활성 유튜브 항목 전용 플레이어.
// 파사드(포스터→탭) 대신 자동재생(muted) iframe을 마운트해 ① 스크롤 시 자동재생 ② 재생 탭 불필요.
// 소리는 브라우저 자동재생 정책상 기본 muted → 상단바 버튼으로 언뮤트(세션 유지).
// 컨트롤(소리·전체화면)은 영상 위가 아니라 상단바에 배치해 YouTube 자체 UI(타이틀·워터마크)와 겹치지 않게 함.
// 전체화면은 네이티브(fullscreen API) 우선 + 미지원/거부 시 CSS 오버레이로 대체해 모바일에서도 확실히 동작.
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { useLang } from "./LangProvider";

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

export default function FeedYouTube({
  id,
  title,
  soundOn,
  onToggleSound,
}: {
  id: string;
  title: string;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const { t } = useLang();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [nativeFs, setNativeFs] = useState(false); // 네이티브 전체화면 활성
  const [cssFs, setCssFs] = useState(false); // 폴백 전체화면(CSS 오버레이)

  // YouTube IFrame API 커맨드 전송(enablejsapi=1 필요)
  const command = (func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  };

  // soundOn 변경 시 뮤트/언뮤트 반영. id 변경(다음 영상) 시에도 사용자의 소리 선택을 유지
  useEffect(() => {
    const tm = setTimeout(() => {
      if (soundOn) {
        command("unMute");
        command("setVolume", [100]);
      } else {
        command("mute");
      }
    }, 400); // iframe 로드 여유
    return () => clearTimeout(tm);
  }, [soundOn, id]);

  // 네이티브 전체화면 종료(시스템 back 등) 감지
  useEffect(() => {
    const onFs = () => setNativeFs(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* noop */ }
      return;
    }
    if (cssFs) {
      setCssFs(false);
      return;
    }
    // 네이티브 우선, 미지원/거부(주로 iOS) 시 CSS 오버레이로 대체
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        return;
      } catch { /* 폴백으로 진행 */ }
    }
    setCssFs(true);
  };

  const fullscreen = nativeFs || cssFs;

  // mute=1은 자동재생 정책상 필수. 사용자가 언뮤트하면 위 이펙트가 unMute 전송
  const src =
    `https://www.youtube-nocookie.com/embed/${id}` +
    `?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&controls=1` +
    (ORIGIN ? `&origin=${encodeURIComponent(ORIGIN)}` : "");

  return (
    <>
      <div
        ref={wrapRef}
        className={`overflow-hidden bg-black ${
          fullscreen ? "fixed inset-0 z-[90] flex items-center justify-center rounded-none" : "relative rounded-2xl"
        }`}
      >
        <div className={fullscreen ? "h-full w-full" : "aspect-video w-full"}>
          <iframe
            ref={iframeRef}
            src={src}
            title={title}
            className="h-full w-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        {/* CSS 폴백 전체화면일 때 나가기 버튼(네이티브는 시스템 제스처로 종료) */}
        {cssFs && (
          <button
            onClick={toggleFullscreen}
            aria-label={t("video_fullscreen")}
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm active:scale-90"
          >
            <Minimize className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 컨트롤 — 상단바 우측(영상 밖). YouTube 자체 UI와 겹치지 않음. 네이티브 전체화면 중엔 YT 컨트롤 사용 */}
      {!fullscreen && (
        <div className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex gap-1.5">
          <button
            onClick={onToggleSound}
            aria-label={soundOn ? t("video_mute") : t("video_unmute")}
            aria-pressed={soundOn}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:scale-90"
          >
            {soundOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={t("video_fullscreen")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:scale-90"
          >
            <Maximize className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}
    </>
  );
}
