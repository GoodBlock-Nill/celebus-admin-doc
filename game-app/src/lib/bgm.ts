// V01D POP — 게임 플레이 BGM: V01D 실곡 랜덤 재생 플레이어.
// HTMLAudio 스트리밍(대용량 곡 메모리 안전) → MediaElementSource → GainNode(iOS 볼륨 정합) 그래프.
// 곡 종료 시 다음 랜덤(직전 곡 제외), 페이드 인/아웃. 현재 곡명은 'gamebgm' CustomEvent + getBgmTitle().
// on/off 토글은 localStorage cfg_bgm(로비 음악과 공유), 트랙 목록·볼륨은 GAME_CONFIG(bgmTracks / audio.bgmVolume).
import { GAME_CONFIG } from "./game-config";
import { getAudioCtx } from "./sfx";

const BGM_KEY = "cfg_bgm";
const FADE_SEC = 0.6;
// 초소형 무음 WAV — iOS WebKit 미디어 요소 언락용(제스처 안에서 1회 재생해 요소를 승인)
const SILENCE =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let el: HTMLAudioElement | null = null;
let gain: GainNode | null = null;
let playing = false;
let lastIdx = -1;
let currentTitle = "";
let currentArtist = "";

export function bgmEnabled(): boolean {
  try {
    const v = localStorage.getItem(BGM_KEY);
    if (v === null) return GAME_CONFIG.audio.bgm;
    return v !== "0";
  } catch {
    return GAME_CONFIG.audio.bgm;
  }
}

export function setBgmEnabled(on: boolean): void {
  try {
    localStorage.setItem(BGM_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (!on) stopBgm();
}

export function getBgmTrack(): { title: string; artist: string } {
  return playing ? { title: currentTitle, artist: currentArtist } : { title: "", artist: "" };
}

function announce(title: string, artist: string): void {
  try {
    document.dispatchEvent(new CustomEvent("gamebgm", { detail: { title, artist } }));
  } catch {
    /* ignore */
  }
}

// 오디오 그래프 준비 — MediaElementSource는 요소당 1회만 생성 가능하므로 전역 유지
function ensureGraph(): boolean {
  if (typeof window === "undefined") return false;
  const ctx = getAudioCtx();
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.addEventListener("ended", () => {
      if (playing) void playNext(); // 곡 종료 → 다음 랜덤
    });
    if (ctx) {
      try {
        const src = ctx.createMediaElementSource(el);
        gain = ctx.createGain();
        src.connect(gain).connect(ctx.destination);
      } catch {
        gain = null; // 그래프 실패 → el.volume 폴백(데스크톱)
      }
    }
  }
  return !!el;
}

// ⚠️ iOS WebKit(아이폰 크롬 포함)은 HTMLAudio.play()를 사용자 제스처 핸들러 안에서만 허용.
// 게임 BGM은 카운트다운 종료(타이머 콜백) 시점에 시작되므로, 진입 제스처에서 이 함수를 먼저 호출해
// 무음 1회 재생으로 요소를 승인(bless)시켜야 이후 프로그램적 재생이 허용된다.
export function unlockBgm(): void {
  if (!bgmEnabled() || playing) return;
  if (!ensureGraph() || !el) return;
  try {
    const a = el;
    a.muted = true;
    a.src = SILENCE;
    const p = a.play();
    p?.then(() => {
      a.pause();
      a.muted = false;
    }).catch(() => {
      a.muted = false;
    });
  } catch {
    /* ignore */
  }
}

function pickNext(): { url: string; title: string; artist?: string } | null {
  const tracks = GAME_CONFIG.bgmTracks;
  if (!tracks?.length) return null;
  let idx = Math.floor(Math.random() * tracks.length);
  if (tracks.length > 1 && idx === lastIdx) idx = (idx + 1) % tracks.length; // 같은 곡 연속 방지
  lastIdx = idx;
  return tracks[idx];
}

async function playNext(): Promise<void> {
  if (!el) return;
  const t = pickNext();
  if (!t) return;
  currentTitle = t.title;
  currentArtist = t.artist ?? "";
  announce(t.title, currentArtist);
  const ctx = getAudioCtx();
  const vol = GAME_CONFIG.audio.bgmVolume;
  if (gain && ctx) {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + FADE_SEC);
  } else {
    el.volume = vol;
  }
  el.src = t.url;
  try {
    await el.play();
  } catch {
    // 자동재생 거절(언락 미비) — 다음 사용자 터치에서 1회 재시도
    const retry = () => {
      window.removeEventListener("pointerdown", retry);
      if (playing && el && el.paused) void el.play().catch(() => {});
    };
    window.addEventListener("pointerdown", retry, { once: true });
  }
}

export function startBgm(): void {
  if (!bgmEnabled() || playing) return;
  if (!ensureGraph()) return;
  playing = true;
  void playNext();
}

export function stopBgm(): void {
  if (!playing && !el) return;
  playing = false;
  currentTitle = "";
  currentArtist = "";
  announce("", "");
  const ctx = getAudioCtx();
  const a = el;
  if (gain && ctx && a && !a.paused) {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    setTimeout(() => {
      if (!playing) a.pause();
    }, 340);
  } else {
    a?.pause();
  }
}

// 피버 시 곡 템포 상승은 유저 피드백으로 제거 — 곡은 항상 정상 배속 재생. 호출부 호환용 no-op.
export function setBgmFever(_mul: number): void {
  void _mul;
}
