"use client";

// 플랫폼별 임베드 렌더러 — 상세 화면 전용 (리스트는 항상 FallbackCard 사용)
// 원칙: 임베드 실패/차단 시 FallbackCard가 1급 UI로 대체한다.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
// 임베드 라이브러리는 상세 화면(레거시 콘테스트)에서만 필요 → 지연 로드로 메인 번들에서 분리
const LiteYouTubeEmbed = dynamic(() => import("react-lite-youtube-embed"), { ssr: false });
const Tweet = dynamic(() => import("react-tweet").then((m) => m.Tweet), { ssr: false });
import { ExternalLink } from "lucide-react";
import type { EntryPublic, Platform } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/i18n";
import { PlatformIcon } from "./PlatformBadge";
import { useLang } from "./LangProvider";

const EMBED_TIMEOUT_MS = 6000;

// ── 폴백 카드 (썸네일 + 플랫폼 + 원본 링크) ──────────────────
export function FallbackCard({ entry, compact = false }: { entry: EntryPublic; compact?: boolean }) {
  const { t } = useLang();
  return (
    <a
      href={entry.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-2xl border border-border bg-card-2"
    >
      {entry.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.thumbnail_url}
          alt={entry.title}
          loading="lazy"
          className={`w-full object-cover ${compact ? "aspect-video" : "max-h-[420px]"}`}
        />
      ) : (
        <div className={`flex items-center justify-center bg-bg ${compact ? "aspect-video" : "h-48"}`}>
          <PlatformIcon platform={entry.platform} className="h-10 w-10 text-muted" />
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5 text-[12px] text-muted">
        <PlatformIcon platform={entry.platform} className="h-3.5 w-3.5" />
        <span className="font-semibold">{PLATFORM_LABELS[entry.platform]}</span>
        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary-400">
          {t("view_original")} <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}

// ── blockquote + embed.js 공용 로더 (TikTok / Instagram / Threads) ──
const loadedScripts = new Set<string>();

function loadScript(src: string): void {
  if (loadedScripts.has(src)) return;
  loadedScripts.add(src);
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  document.body.appendChild(s);
}

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

function ScriptEmbed({ entry }: { entry: EntryPublic }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (entry.platform === "tiktok") loadScript("https://www.tiktok.com/embed.js");
    if (entry.platform === "instagram") {
      loadScript("https://www.instagram.com/embed.js");
      // 스크립트가 이미 로드된 경우 재처리 필요
      window.instgrm?.Embeds.process();
    }
    if (entry.platform === "threads") loadScript("https://www.threads.com/embed.js");

    const timer = setTimeout(() => {
      if (!el.querySelector("iframe")) setFailed(true);
    }, EMBED_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [entry.platform, entry.external_id]);

  if (failed) return <FallbackCard entry={entry} />;

  return (
    <div ref={ref} className="embed-host [&_iframe]:!m-0">
      {entry.platform === "tiktok" && (
        <blockquote
          className="tiktok-embed"
          cite={entry.source_url}
          data-video-id={entry.external_id}
          style={{ maxWidth: 605, minWidth: 325, margin: 0 }}
        >
          <section />
        </blockquote>
      )}
      {entry.platform === "instagram" && (
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={entry.source_url}
          data-instgrm-version="14"
          style={{ margin: 0, width: "100%" }}
        />
      )}
      {entry.platform === "threads" && (
        <blockquote
          className="text-post-media"
          data-text-post-permalink={entry.source_url}
          data-text-post-version="0"
          style={{ margin: 0, width: "100%" }}
        />
      )}
    </div>
  );
}

// ── 메인 렌더러 ──────────────────────────────────────────────
export default function EntryEmbed({ entry }: { entry: EntryPublic }) {
  switch (entry.platform) {
    case "youtube":
      return (
        <div className="overflow-hidden rounded-2xl">
          <LiteYouTubeEmbed id={entry.external_id} title={entry.title} noCookie poster="hqdefault" />
        </div>
      );
    case "x":
      return (
        <div data-theme="dark" className="[&>div]:!my-0 flex justify-center">
          <Tweet id={entry.external_id} fallback={<FallbackCard entry={entry} />} />
        </div>
      );
    case "tiktok":
    case "instagram":
    case "threads":
      return <ScriptEmbed entry={entry} />;
    default:
      return <FallbackCard entry={entry} />;
  }
}
