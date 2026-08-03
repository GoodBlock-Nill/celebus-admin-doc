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

// 화면 방향 잠금 — 안드로이드/크로미움만 지원(iOS·데스크톱 미지원 → 조용히 실패).
// lib.dom 타입 충돌을 피해 구조적 캐스트 사용.
type OrientationCtl = { lock?: (o: string) => Promise<void>; unlock?: () => void };
function orientationCtl(): OrientationCtl | null {
  if (typeof screen === "undefined" || !screen.orientation) return null;
  return screen.orientation as unknown as OrientationCtl;
}
function lockLandscape(): Promise<void> {
  const o = orientationCtl();
  return o?.lock ? o.lock("landscape") : Promise.reject(new Error("unsupported"));
}
function unlockOrientation(): void {
  const o = orientationCtl();
  try { o?.unlock?.(); } catch { /* noop */ }
}

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

  // 화질 상향 — best-effort: 로드 후 고화질을 제안(YouTube 자동선택이 저화질로 시작하는 것 완화).
  // 실제 화질을 결정하는 핵심은 아래 iframe 2배 렌더(고해상도 스트림 유도)이며, 이건 보조 힌트.
  useEffect(() => {
    const timers = [800, 2000].map((ms) => setTimeout(() => command("setPlaybackQuality", ["hd1080"]), ms));
    return () => timers.forEach(clearTimeout);
  }, [id]);

  // 네이티브 전체화면 종료(시스템 back 등) 감지 + 종료 시 방향 잠금 해제
  useEffect(() => {
    const onFs = () => {
      const active = document.fullscreenElement === wrapRef.current;
      setNativeFs(active);
      if (!active) unlockOrientation();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const enterFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    // 네이티브 전체화면 + 가로 잠금(안드로이드/크로미움). 성공 시 자동으로 가로 전환
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        lockLandscape().catch(() => { /* iOS 등 미지원 — 사용자가 직접 회전 */ });
        return;
      } catch { /* 폴백으로 진행 */ }
    }
    // iOS 등: CSS 90° 회전으로 세로 화면을 가로로 채움(폰을 가로로 돌리면 정방향)
    setCssFs(true);
  };

  const exitFullscreen = async () => {
    unlockOrientation();
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* noop */ }
    }
    setCssFs(false);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement || cssFs) void exitFullscreen();
    else void enterFullscreen();
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
          nativeFs
            ? "fixed inset-0 z-[90] flex items-center justify-center rounded-none"
            : cssFs
              ? "fixed inset-0 z-[90] rounded-none"
              : "relative rounded-2xl"
        }`}
      >
        <div
          className={nativeFs ? "h-full w-full" : cssFs ? "absolute left-1/2 top-1/2" : "aspect-video w-full"}
          // CSS 폴백: 세로 뷰포트를 가로로 채우도록 90° 회전(가로=100vh, 세로=100vw)
          style={cssFs ? { width: "100vh", height: "100vw", transform: "translate(-50%, -50%) rotate(90deg)" } : undefined}
        >
          <iframe
            ref={iframeRef}
            src={src}
            title={title}
            className="h-full w-full border-0"
            // 인라인 재생 시 2배 크기로 렌더 후 0.5배 축소 → YouTube가 큰 플레이어로 인식해
            // 고해상도(720p+) 스트림을 선택. 화면엔 선명하게 다운스케일(레티나 대응).
            // 전체화면(native/css)은 이미 큰 크기라 스케일 없이 원본 그대로.
            style={
              fullscreen
                ? undefined
                : { width: "200%", height: "200%", transform: "scale(0.5)", transformOrigin: "top left" }
            }
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
