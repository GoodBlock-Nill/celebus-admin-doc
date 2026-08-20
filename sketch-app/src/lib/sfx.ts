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

// 단일 보이스 — 즉시(또는 delay 후) 시작. harmonics로 배음 레이어(더 풍성한 음색), attack로 어택 타이트.
function voice(
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; slideTo?: number; delay?: number; attack?: number; harmonics?: number[] } = {},
): void {
  if (!soundEnabled()) return;
  const c = audioCtx();
  if (!c) return;
  const master = GAME_CONFIG.audio.volume;
  const t = c.currentTime + (opts.delay ?? 0);
  const attack = opts.attack ?? 0.008;
  const harmonics = opts.harmonics ?? [1]; // 배음 진폭(1=기음, 이후 2·3배 주파수)
  harmonics.forEach((amp, k) => {
    if (amp <= 0) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(freq * (k + 1), t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo * (k + 1)), t + dur);
    const peak = Math.max(0.0001, amp * (opts.gain ?? 1) * master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  });
}

// 노이즈 트랜지언트 — 필터드 화이트노이즈로 타격/사각거림 표현(샘플 없이 "샘플 같은" 질감)
let noiseBuf: AudioBuffer | null = null;
function getNoise(c: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 0.5);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}
function noise(
  dur: number,
  opts: { gain?: number; filter?: BiquadFilterType; freq?: number; freqTo?: number; q?: number; delay?: number } = {},
): void {
  if (!soundEnabled()) return;
  const c = audioCtx();
  if (!c) return;
  const master = GAME_CONFIG.audio.volume;
  const t = c.currentTime + (opts.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const filt = c.createBiquadFilter();
  filt.type = opts.filter ?? "bandpass";
  filt.frequency.setValueAtTime(opts.freq ?? 2000, t);
  if (opts.freqTo) filt.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqTo), t + dur);
  filt.Q.value = opts.q ?? 1;
  const g = c.createGain();
  const peak = Math.max(0.0001, (opts.gain ?? 0.3) * master);
  g.gain.setValueAtTime(peak, t); // 퍼커시브 — 즉시 어택 후 감쇠
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}

// C 계열 상승 사다리 — 콤보가 오를수록 높은 음
const LADDER = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5];

// 매치음 — 체인 음정 상승 + 배음으로 풍성한 벨 음색 + 타격 트랜지언트 + 큰 매치 저음 임팩트
export const sfxMatch = (chain: number, size = 0) => {
  const f = LADDER[Math.min(Math.max(chain, 1) - 1, LADDER.length - 1)];
  voice(f, 0.14, { type: "triangle", gain: 0.78, attack: 0.004, harmonics: [1, 0.28, 0.1] });
  noise(0.032, { filter: "highpass", freq: 2600, gain: 0.11 }); // 타격 트랜지언트("툭")
  if (size >= 5) {
    const depth = Math.min(size, 18);
    voice(150 - depth * 4, 0.15, { type: "sine", gain: 0.3 + Math.min(depth, 12) * 0.02 }); // 클수록 더 깊고 크게
    noise(0.06, { filter: "lowpass", freq: 380, gain: 0.12 }); // 저역 바디
  }
  if (chain >= 4) voice(f * 2, 0.09, { type: "triangle", gain: 0.22, delay: 0.02, harmonics: [1, 0.4] }); // 고콤보 스파클
};

// 스페셜+스페셜 메가콤보 — 저음 스윕 + 상승 리저 + 서브베이스 쿵 + 노이즈 스윕/임팩트(웅장)
export const sfxCombo = () => {
  voice(220, 0.5, { type: "sawtooth", gain: 0.5, slideTo: 70 });
  voice(520, 0.45, { type: "triangle", gain: 0.45, slideTo: 1500, harmonics: [1, 0.3] });
  voice(95, 0.22, { type: "sine", gain: 0.6 });
  voice(1320, 0.26, { type: "square", gain: 0.24, delay: 0.12 });
  noise(0.42, { filter: "bandpass", freq: 2600, freqTo: 300, q: 0.6, gain: 0.28 }); // 화이트 스윕
  noise(0.09, { filter: "lowpass", freq: 300, gain: 0.42 }); // 서브 임팩트
};
export const sfxItem = () => {
  voice(320, 0.18, { type: "sawtooth", gain: 0.6, slideTo: 900 });
  noise(0.03, { filter: "highpass", freq: 3200, gain: 0.1 });
};
export const sfxInvalid = () => play([{ freq: 190, slideTo: 120, dur: 0.15, type: "square", gain: 0.5 }]);
export const sfxCountdown = () => play([{ freq: 440, dur: 0.09, type: "sine", gain: 0.6 }]);
export const sfxGo = () => play([{ freq: 660, dur: 0.1, type: "triangle" }, { freq: 990, dur: 0.2, type: "triangle" }]);
export const sfxGameOver = () =>
  play([{ freq: 440, dur: 0.14, type: "sine" }, { freq: 330, dur: 0.14, type: "sine" }, { freq: 262, dur: 0.28, type: "sine" }]);
// 최고 기록 — 배음 풍성한 상승 팡파레 + 반짝 노이즈
export const sfxNewBest = () => {
  [523, 659, 784, 1046].forEach((f, i) => voice(f, i === 3 ? 0.3 : 0.11, { type: "triangle", gain: 0.6, delay: i * 0.09, harmonics: [1, 0.4, 0.18] }));
  noise(0.05, { filter: "highpass", freq: 5000, gain: 0.1, delay: 0.27 });
};
export const sfxCoin = () =>
  play([{ freq: 880, dur: 0.08, type: "square", gain: 0.5 }, { freq: 1318, dur: 0.13, type: "square", gain: 0.5 }]);
// 스페셜 생성(파워업 획득) — 배음 벨 상승 3음 + 하이 반짝
export const sfxPower = () => {
  [660, 990, 1320].forEach((f, i) => voice(f, 0.12, { type: "triangle", gain: 0.44, delay: i * 0.06, harmonics: [1, 0.35, 0.14] }));
  noise(0.04, { filter: "highpass", freq: 5200, gain: 0.09, delay: 0.12 });
};
// 스페셜 발동(폭발) — 굵은 하강 스윕 + 서브 + 노이즈 파열(샘플 같은 질감)
export const sfxSpecial = () => {
  voice(700, 0.32, { type: "sawtooth", gain: 0.7, slideTo: 140 });
  voice(90, 0.18, { type: "sine", gain: 0.5 });
  noise(0.3, { filter: "bandpass", freq: 1900, freqTo: 220, q: 0.7, gain: 0.28 });
};
// 막판 카운트다운 틱(잔여 10초) — 낮은 볼륨, 초당 1회
export const sfxTick = () => play([{ freq: 1150, dur: 0.045, type: "square", gain: 0.22 }]);
// 피버 진입 스팅어 — 상승 3연타 + 하이 사각거림
export const sfxFever = () => {
  [587, 880, 1174].forEach((f, i) => voice(f, i === 2 ? 0.18 : 0.07, { type: "sawtooth", gain: 0.5, delay: i * 0.06 }));
  noise(0.2, { filter: "highpass", freq: 4200, gain: 0.11 });
};
// 레벨 업 — 배음 풍성한 상승 팡파레(4음)
export const sfxLevelUp = () =>
  [523, 659, 784, 1046].forEach((f, i) => voice(f, i === 3 ? 0.24 : 0.1, { type: "triangle", gain: 0.55, delay: i * 0.085, harmonics: [1, 0.32, 0.12] }));
