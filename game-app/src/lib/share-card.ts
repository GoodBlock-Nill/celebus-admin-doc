// 결과 공유 카드 — 캔버스로 1080×1080 이미지 생성 → 시스템 공유(지원 시) 또는 다운로드.
// 폰트는 앱에 로드된 Noto Sans KR 사용, 배경·로고는 config 에셋(실패 시 그라데 폴백).
import { GAME_CONFIG } from "./game-config";

const W = 1080;
const H = 1080;

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(g: CanvasRenderingContext2D, img: HTMLImageElement) {
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

export async function buildResultCard(input: {
  score: number;
  level: number;
  nickname: string;
  modeLabel: string;
  newBest: boolean;
}): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  if (!g) return null;

  // 배경 (무대 아트 → 어둡게, 실패 시 그라데)
  const bg = await loadImg(GAME_CONFIG.home.background ?? "");
  if (bg) {
    drawCover(g, bg);
    g.fillStyle = "rgba(8, 6, 16, 0.66)";
    g.fillRect(0, 0, W, H);
  } else {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#14101c");
    grad.addColorStop(1, "#0b0b0d");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  }
  // 하단 비네트
  const vign = g.createLinearGradient(0, H * 0.6, 0, H);
  vign.addColorStop(0, "rgba(0,0,0,0)");
  vign.addColorStop(1, "rgba(0,0,0,0.55)");
  g.fillStyle = vign;
  g.fillRect(0, 0, W, H);

  // 로고
  const logo = await loadImg(GAME_CONFIG.home.logo ?? "");
  if (logo) {
    const lw = 560;
    const lh = (logo.naturalHeight / logo.naturalWidth) * lw;
    g.drawImage(logo, (W - lw) / 2, 90, lw, lh);
  }

  g.textAlign = "center";
  // 앱에 로드된 폰트(도트 폰트 포함) 그대로 사용 — next/font는 고유 패밀리명을 생성하므로 body에서 조회
  const fam = getComputedStyle(document.body).fontFamily || "'Noto Sans KR', sans-serif";

  // 신기록 리본
  if (input.newBest) {
    g.fillStyle = "#f5c451";
    g.font = `700 44px ${fam}`;
    g.fillText("★ NEW RECORD ★", W / 2, 500);
  }

  // 점수
  g.fillStyle = "#ffffff";
  g.font = `700 200px ${fam}`;
  g.shadowColor = "rgba(139, 92, 246, 0.55)";
  g.shadowBlur = 40;
  g.fillText(input.score.toLocaleString(), W / 2, 720);
  g.shadowBlur = 0;

  // 레벨 · 모드 · 닉네임
  g.fillStyle = "#a78bfa";
  g.font = `700 52px ${fam}`;
  g.fillText(`Lv.${input.level} · ${input.modeLabel}`, W / 2, 800);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.font = `700 44px ${fam}`;
  g.fillText(`@${input.nickname}`, W / 2, 870);

  // 하단 URL
  g.fillStyle = "rgba(255,255,255,0.4)";
  g.font = `700 30px ${fam}`;
  g.fillText("game-app-rho-pearl.vercel.app", W / 2, 1010);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

// 시스템 공유(파일 지원 시) → 실패/미지원이면 다운로드 폴백. 반환: 처리 여부.
export async function shareResultCard(input: Parameters<typeof buildResultCard>[0]): Promise<boolean> {
  const blob = await buildResultCard(input);
  if (!blob) return false;
  const file = new File([blob], "celebmatch-score.png", { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "CELEB MATCH" });
      return true;
    }
  } catch {
    /* 사용자가 공유 취소 — 다운로드로 넘기지 않고 종료 */
    return true;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "celebmatch-score.png";
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
