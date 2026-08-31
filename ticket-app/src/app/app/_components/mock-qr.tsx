'use client';

import { useEffect, useRef } from 'react';

/** 모의 QR 격자 크기 (실제 QR 버전1과 동일한 21모듈) */
const MODULE_COUNT = 21;
/** 모서리 인식 패턴 크기 */
const FINDER_SIZE = 7;
/** 여백(quiet zone) 모듈 수 */
const QUIET_ZONE = 2;

const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 4294967296;
const HASH_SEED = 2166136261;
const HASH_PRIME = 16777619;
const FILL_THRESHOLD = 0.5;

const QR_DARK = '#0F1014';
const QR_LIGHT = '#FFFFFF';

function hashCode(code: string): number {
  let acc = HASH_SEED;
  for (let index = 0; index < code.length; index += 1) {
    acc ^= code.charCodeAt(index);
    acc = Math.imul(acc, HASH_PRIME) >>> 0;
  }
  return acc >>> 0;
}

/** 모서리 인식 패턴 영역인지 판정 */
function isFinderArea(row: number, col: number): boolean {
  const inTopLeft = row < FINDER_SIZE && col < FINDER_SIZE;
  const inTopRight = row < FINDER_SIZE && col >= MODULE_COUNT - FINDER_SIZE;
  const inBottomLeft = row >= MODULE_COUNT - FINDER_SIZE && col < FINDER_SIZE;
  return inTopLeft || inTopRight || inBottomLeft;
}

/** 인식 패턴 내부 좌표의 칠 여부 (3중 사각형 형태) */
function isFinderFilled(row: number, col: number): boolean {
  const localRow = row < FINDER_SIZE ? row : row - (MODULE_COUNT - FINDER_SIZE);
  const localCol = col < FINDER_SIZE ? col : col - (MODULE_COUNT - FINDER_SIZE);
  const ring = Math.max(
    Math.abs(localRow - (FINDER_SIZE - 1) / 2),
    Math.abs(localCol - (FINDER_SIZE - 1) / 2),
  );
  return ring !== 2;
}

/** 코드 문자열을 시드로 결정적 격자를 만든다. */
function buildModules(code: string): boolean[][] {
  let seed = hashCode(code);
  const next = () => {
    seed = (Math.imul(seed, LCG_MULTIPLIER) + LCG_INCREMENT) % LCG_MODULUS;
    return seed / LCG_MODULUS;
  };

  return Array.from({ length: MODULE_COUNT }, (_, row) =>
    Array.from({ length: MODULE_COUNT }, (_, col) => {
      const random = next();
      if (isFinderArea(row, col)) return isFinderFilled(row, col);
      return random < FILL_THRESHOLD;
    }),
  );
}

interface MockQrProps {
  code: string;
  size?: number;
}

/** 시연용 모의 QR — 코드 문자열에서 항상 같은 패턴이 그려진다. */
export function MockQr({ code, size = 200 }: MockQrProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = size * ratio;
    canvas.height = size * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const totalModules = MODULE_COUNT + QUIET_ZONE * 2;
    const moduleSize = size / totalModules;

    context.fillStyle = QR_LIGHT;
    context.fillRect(0, 0, size, size);

    const modules = buildModules(code);
    context.fillStyle = QR_DARK;
    modules.forEach((rowValues, row) => {
      rowValues.forEach((filled, col) => {
        if (!filled) return;
        context.fillRect(
          (col + QUIET_ZONE) * moduleSize,
          (row + QUIET_ZONE) * moduleSize,
          moduleSize,
          moduleSize,
        );
      });
    });
  }, [code, size]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`입장 코드 ${code}`}
      style={{ width: size, height: size }}
      className="rounded-xl bg-white"
    />
  );
}
