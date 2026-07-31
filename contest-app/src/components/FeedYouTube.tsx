"use client";

// 몰입 피드의 활성 유튜브 항목 전용 플레이어.
// 파사드(포스터→탭) 대신 자동재생(muted) iframe을 마운트해 ① 스크롤 시 자동재생 ② 재생 탭 불필요.
// 소리는 브라우저 자동재생 정책상 기본 muted → 사용자 탭으로 언뮤트(세션 유지). 전체화면 버튼 제공.
import { useEffect, useRef } from "react";
import { Volume2, VolumeX, Maximize } from "lucide-react";
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

  const goFullscreen = () => {
    const el = iframeRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void el.requestFullscreen?.().catch(() => {});
  };

  // mute=1은 자동재생 정책상 필수. 사용자가 언뮤트하면 위 이펙트가 unMute 전송
  const src =
    `https://www.youtube-nocookie.com/embed/${id}` +
    `?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&controls=1` +
    (ORIGIN ? `&origin=${encodeURIComponent(ORIGIN)}` : "");

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black">
      <div className="aspect-video w-full">
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          className="h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* 소리 / 전체화면 — 영상 프레임 우상단(레일과 겹치지 않음) */}
      <div className="absolute right-2 top-2 z-10 flex gap-1.5">
        <button
          onClick={onToggleSound}
          aria-label={soundOn ? t("video_mute") : t("video_unmute")}
          aria-pressed={soundOn}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:scale-90"
        >
          {soundOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
        </button>
        <button
          onClick={goFullscreen}
          aria-label={t("video_fullscreen")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:scale-90"
        >
          <Maximize className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* 음소거 상태 — 소리 켜기 유도(1탭) */}
      {!soundOn && (
        <button
          onClick={onToggleSound}
          className="absolute inset-x-0 bottom-2 mx-auto flex w-max items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur-sm active:scale-95"
        >
          <VolumeX className="h-3.5 w-3.5" /> {t("video_tap_sound")}
        </button>
      )}
    </div>
  );
}
