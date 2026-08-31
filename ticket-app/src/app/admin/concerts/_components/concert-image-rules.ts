/**
 * 공연 포스터 · 상세 이미지 등록 규격과 안내 문구.
 * 실제 예매 플랫폼(포스터 3:4 세로형, 상세 이미지 가로 860px)의 등록 규격을 따른다.
 */

/** 공연 소개 글자 수 상한 */
export const MAX_DESCRIPTION_LENGTH = 2000;

/** 상세 이미지 최대 장수 */
export const MAX_DETAIL_IMAGE_COUNT = 10;

/** 포스터 최소 크기 (가로 × 세로) */
export const POSTER_MIN_WIDTH = 750;
export const POSTER_MIN_HEIGHT = 1000;

/** 포스터 권장 비율 3:4 — 이 값에서 10%를 넘게 벗어나면 경고만 하고 등록은 허용한다. */
const POSTER_RATIO = 3 / 4;
const POSTER_RATIO_TOLERANCE = 0.1;

/** 포스터 업로드 안내 */
export const POSTER_GUIDE = [
  '· 권장 크기: 1080 × 1440px (3:4 비율) · 최소 750 × 1000px 이상',
  '· 파일 형식: JPG, PNG (JPG 권장) · 용량: 5MB 이하',
  '· 텍스트가 많은 이미지는 목록/썸네일에서 잘리거나 가독성이 떨어질 수 있습니다. 공연명·일정·장소 등 핵심 정보는 이미지 대신 입력 항목을 이용해 주세요.',
  '· 저작권 및 출연진 초상권을 확인한 이미지만 등록해 주세요. 권리 미확인 이미지 등록 시 게시가 중단되거나 법적 책임이 발생할 수 있습니다.',
];

/** 상세 이미지 업로드 안내 */
export const DETAIL_IMAGE_GUIDE = [
  '· 권장 가로 크기: 860px (세로 길이는 자유롭게 제작 가능)',
  '· 파일 형식: JPG, PNG · 용량: 장당 2MB 이하 · 최대 10장',
  '· 이미지 안에 텍스트로만 전달되는 정보(공지·예매 유의사항 등)는 화면낭독기·검색에서 인식되지 않을 수 있으니, 중요 안내는 텍스트 항목에도 함께 입력해 주세요.',
];

export interface ImageSize {
  width: number;
  height: number;
}

/** 포스터 크기 점검 결과 — 사유가 있으면 등록 차단, 주의만 있으면 등록은 허용한다. */
export interface PosterSizeCheck {
  error?: string;
  warning?: string;
}

/** 선택한 이미지의 실제 크기를 읽는다 (읽지 못하면 값 없음) */
export function readImageSize(file: File): Promise<ImageSize | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    image.src = objectUrl;
  });
}

function formatSize(size: ImageSize): string {
  return `${size.width.toLocaleString('ko-KR')} × ${size.height.toLocaleString('ko-KR')}px`;
}

/** 포스터 크기·비율 점검 — 최소 크기 미달은 등록을 막고, 비율 차이는 주의 문구만 남긴다. */
export function checkPosterSize(size: ImageSize): PosterSizeCheck {
  if (size.width < POSTER_MIN_WIDTH || size.height < POSTER_MIN_HEIGHT) {
    return {
      error:
        `포스터는 최소 ${POSTER_MIN_WIDTH.toLocaleString('ko-KR')} × ` +
        `${POSTER_MIN_HEIGHT.toLocaleString('ko-KR')}px 이상이어야 합니다. ` +
        `(선택한 이미지 ${formatSize(size)})`,
    };
  }

  const ratio = size.width / size.height;
  if (Math.abs(ratio - POSTER_RATIO) > POSTER_RATIO * POSTER_RATIO_TOLERANCE) {
    return {
      warning:
        `권장 비율 3:4와 달라 목록·상세에서 일부가 잘려 보일 수 있습니다. (선택한 이미지 ${formatSize(size)}) ` +
        '그대로 등록할 수는 있습니다.',
    };
  }

  return {};
}
