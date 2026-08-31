// 인메모리 IP 스로틀 (단일 인스턴스 기준 best-effort).
// 서버리스 다중 인스턴스에서는 완벽하지 않으므로 트래픽이 커지면 외부 저장소로 이전 권장.

const MS_PER_MINUTE = 60 * 1000;
const BUCKET_CLEANUP_THRESHOLD = 5000;

interface Counter {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Map<string, Counter>>();

function hit(scope: string, key: string, windowMs: number, max: number): boolean {
  const bucket = buckets.get(scope) ?? new Map<string, Counter>();
  buckets.set(scope, bucket);

  const now = Date.now();
  const record = bucket.get(key);
  if (!record || now > record.resetAt) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    if (bucket.size > BUCKET_CLEANUP_THRESHOLD) {
      for (const [k, v] of bucket) if (now > v.resetAt) bucket.delete(k);
    }
    return false;
  }

  record.count += 1;
  return record.count > max;
}

/** 로그인·본인확인 시도 스로틀 — 10분 8회 */
const AUTH_WINDOW_MS = 10 * MS_PER_MINUTE;
const AUTH_MAX = 8;

export function tooManyAttempts(key: string): boolean {
  return hit('auth', key, AUTH_WINDOW_MS, AUTH_MAX);
}

/** 성공 시 시도 카운터 리셋 — 공유 IP(캐리어 NAT)의 정상 다수 사용자 보호 */
export function resetAttempts(key: string): void {
  buckets.get('auth')?.delete(key);
}

/** 주문·취소·신고 등 일반 변이 스로틀 — 1시간 60회 */
const MUTATION_WINDOW_MS = 60 * MS_PER_MINUTE;
const MUTATION_MAX = 60;

export function mutationThrottled(key: string): boolean {
  return hit('mutation', key, MUTATION_WINDOW_MS, MUTATION_MAX);
}
