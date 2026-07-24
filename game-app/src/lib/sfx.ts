// V01D POP — 절차적 WebAudio 사운드(에셋 불필요, 오프라인·PWA 적합).
// 짧은 오실레이터+엔벨로프로 매치/콤보/아이템/무효/카운트다운/게임오버/보상 효과음 생성.
// 볼륨·기본 on/off는 GAME_CONFIG.audio(관리자 튜닝), 사용자 토글은 localStorage cfg_sound.
import { GAME_CONFIG } from "./game-config";

const SOUND_KEY = "cfg_sound";
let ctx: AudioContext | null = null;

export function soundEnabled(): boolean {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    if (v === null) return GAME_CONFIG.audio.enabled;
    return v !== "0";
  } catch {
    return GAME_CONFIG.audio.enabled;
  }
}

export function setSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (on) unlockAudio();
}

// 공용 AudioContext — SFX·BGM·로비 음악이 공유(iOS 컨텍스트 수 제한 대응)
export function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}
const audioCtx = getAudioCtx;

// 브라우저 오디오 정책상 첫 사용자 제스처에서 호출해 언락(재생 버튼·첫 탭 등)
export function unlockAudio(): void {
  audioCtx();
}

type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

function play(tones: Tone[]): void {
  if (!soundEnabled()) return;
  const c = audioCtx();
  if (!c) return;
  const master = GAME_CONFIG.audio.volume;
  let t = c.currentTime;
  for (const tone of tones) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.setValueAtTime(tone.freq, t);
    if (tone.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, tone.slideTo), t + tone.dur);
    const peak = Math.max(0.0001, (tone.gain ?? 1) * master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + tone.dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + tone.dur + 0.02);
    t += tone.dur * 0.85; // 시퀀스는 살짝 겹치게
  }
}

// C 계열 상승 사다리 — 콤보가 오를수록 높은 음
const LADDER = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5];

export const sfxMatch = (chain: number) =>
  play([{ freq: LADDER[Math.min(Math.max(chain, 1) - 1, LADDER.length - 1)], dur: 0.12, type: "triangle", gain: 0.9 }]);
export const sfxItem = () => play([{ freq: 320, slideTo: 900, dur: 0.18, type: "sawtooth", gain: 0.7 }]);
export const sfxInvalid = () => play([{ freq: 190, slideTo: 120, dur: 0.15, type: "square", gain: 0.5 }]);
export const sfxCountdown = () => play([{ freq: 440, dur: 0.09, type: "sine", gain: 0.6 }]);
export const sfxGo = () => play([{ freq: 660, dur: 0.1, type: "triangle" }, { freq: 990, dur: 0.2, type: "triangle" }]);
export const sfxGameOver = () =>
  play([{ freq: 440, dur: 0.14, type: "sine" }, { freq: 330, dur: 0.14, type: "sine" }, { freq: 262, dur: 0.28, type: "sine" }]);
export const sfxNewBest = () =>
  play([
    { freq: 523, dur: 0.1, type: "triangle" },
    { freq: 659, dur: 0.1, type: "triangle" },
    { freq: 784, dur: 0.1, type: "triangle" },
    { freq: 1046, dur: 0.26, type: "triangle" },
  ]);
export const sfxCoin = () =>
  play([{ freq: 880, dur: 0.08, type: "square", gain: 0.5 }, { freq: 1318, dur: 0.13, type: "square", gain: 0.5 }]);
// 스페셜 생성(파워업 획득) — 밝은 상승 차임
export const sfxPower = () =>
  play([{ freq: 660, dur: 0.08, type: "triangle" }, { freq: 990, dur: 0.08, type: "triangle" }, { freq: 1320, dur: 0.16, type: "triangle" }]);
// 스페셜 발동(폭발) — 굵은 하강 스윕
export const sfxSpecial = () => play([{ freq: 700, slideTo: 140, dur: 0.32, type: "sawtooth", gain: 0.85 }]);
// 막판 카운트다운 틱(잔여 10초) — 낮은 볼륨, 초당 1회
export const sfxTick = () => play([{ freq: 1150, dur: 0.045, type: "square", gain: 0.22 }]);
// 피버 진입 스팅어 — 짧은 상승 3연타
export const sfxFever = () =>
  play([
    { freq: 587, dur: 0.07, type: "sawtooth", gain: 0.5 },
    { freq: 880, dur: 0.07, type: "sawtooth", gain: 0.5 },
    { freq: 1174, dur: 0.18, type: "sawtooth", gain: 0.55 },
  ]);
// 레벨 업 — 상승 팡파레(4음)
export const sfxLevelUp = () =>
  play([
    { freq: 523, dur: 0.09, type: "triangle" },
    { freq: 659, dur: 0.09, type: "triangle" },
    { freq: 784, dur: 0.09, type: "triangle" },
    { freq: 1046, dur: 0.22, type: "triangle" },
  ]);
