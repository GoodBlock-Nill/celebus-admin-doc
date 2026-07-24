// 아바타 업로드용 클라이언트 이미지 처리 — 중앙 정사각 크롭 + 리사이즈 → JPEG dataURL
const MAX_FILE_BYTES = 12 * 1024 * 1024; // 원본 상한 12MB — 초대형 파일 디코드 시도 차단

export async function fileToAvatarDataUrl(file: File, size = 256): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size > MAX_FILE_BYTES) return null;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    URL.revokeObjectURL(url);
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) return null;
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const g = canvas.getContext("2d");
    if (!g) return null;
    g.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}
