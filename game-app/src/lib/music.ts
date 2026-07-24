// V01D POP — 홈(로비) 배경음악. WebAudio 버퍼 재생 + GainNode 페이드(0.8s).
// ⚠️ iOS Safari는 <audio>.volume 설정을 무시(항상 원음 크기) → 반드시 GainNode로 볼륨 제어해야 모바일 정합.
//    버퍼 루프 방식이라 mp3 루프 공백도 없음(갭리스). 컨텍스트는 SFX와 공유(getAudioCtx).
// on/off는 게임 설정의 BGM 토글(cfg_bgm, bgm.ts와 공유). 트랙 URL·볼륨은 GAME_CONFIG(home.music / audio.homeVolume) — 관리자 교체.
import { GAME_CONFIG } from "./game-config";
import { bgmEnabled } from "./bgm";
import { getAudioCtx } from "./sfx";

const FADE_SEC = 0.8;

let buffer: AudioBuffer | null = null;
let loadedUrl = "";
let loading: Promise<AudioBuffer | null> | null = null;
let src: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let wantPlay = false; // 최종 의도(재생/정지) — 로딩·제스처 대기 중 상태 꼬임 방지
let gestureArmed = false;

// QA·디버깅용 상태 표식 (렌더 영향 없음)
function markState(on: boolean): void {
  try {
    document.documentElement.dataset.lobbyMusic = on ? "playing" : "stopped";
  } catch {
    /* ignore */
  }
}

async function loadBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  const url = GAME_CONFIG.home.music;
  if (!url) return null;
  if (buffer && loadedUrl === url) return buffer;
  if (!loading) {
    loading = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((ab) => ctx.decodeAudioData(ab))
      .then((b) => {
        buffer = b;
        loadedUrl = url;
        return b;
      })
      .catch(() => null)
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

// 자동재생 정책으로 컨텍스트가 잠겨 있으면 첫 제스처에서 재시도
function armGesture(): void {
  if (gestureArmed) return;
  gestureArmed = true;
  const retry = () => {
    window.removeEventListener("pointerdown", retry);
    window.removeEventListener("keydown", retry);
    gestureArmed = false;
    if (wantPlay) void playMusic();
  };
  window.addEventListener("pointerdown", retry, { once: true });
  window.addEventListener("keydown", retry, { once: true });
}

export async function playMusic(): Promise<void> {
  wantPlay = true;
  if (!bgmEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const running = () => ctx.state === "running";
  if (!running()) {
    try {
      await ctx.resume();
    } catch {
      /* 제스처 필요 */
    }
    if (!running()) {
      armGesture();
      return;
    }
  }
  const buf = await loadBuffer(ctx);
  if (!buf || !wantPlay || src) return; // 로딩 중 정지됐거나 이미 재생 중
  gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(GAME_CONFIG.audio.homeVolume, ctx.currentTime + FADE_SEC);
  src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(gain).connect(ctx.destination);
  src.start();
  markState(true);
}

export function stopMusic(): void {
  wantPlay = false;
  const ctx = getAudioCtx();
  const s = src;
  const g = gain;
  src = null;
  gain = null;
  markState(false);
  if (!ctx || !s || !g) return;
  try {
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + FADE_SEC);
    s.stop(ctx.currentTime + FADE_SEC + 0.05);
  } catch {
    try {
      s.stop();
    } catch {
      /* ignore */
    }
  }
  setTimeout(
    () => {
      try {
        s.disconnect();
        g.disconnect();
      } catch {
        /* ignore */
      }
    },
    (FADE_SEC + 0.2) * 1000,
  );
}
