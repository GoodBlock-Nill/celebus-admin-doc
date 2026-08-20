// 인메모리 비밀번호 시도 스로틀 (파일럿 규모용 — 단일 인스턴스 기준 best-effort).
// 굿즈 탈취를 노린 4자리 비밀번호 무차별 대입을 늦추는 목적.
// 주: 서버리스 다중 인스턴스에서는 완벽하지 않으므로, 트래픽이 커지면 Upstash 등으로 이전 권장.

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000; // 10분
const MAX_ATTEMPTS = 8; // 키(IP+리소스)당 10분 8회

export function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now > rec.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    // 가끔 만료 항목 정리
    if (attempts.size > 5000) {
      for (const [k, v] of attempts) if (now > v.resetAt) attempts.delete(k);
    }
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

// 성공 시 카운터 리셋
export function resetAttempts(key: string): void {
  attempts.delete(key);
}

// 투표 IP 총량 스로틀 — voter_hash와 무관하게 "한 IP에서 무한 새 디바이스로 조작"을 차단.
// 공유 IP(모바일 캐리어 NAT 등)의 정상 다수 투표는 통과하도록 상한은 넉넉하게(시간당 30).
// 성공/실패 무관하게 누적(리셋 없음). 자동 대량 조작만 차단하고, 최종 이상치는 finalize 전 관리자 검토.
const votes = new Map<string, { count: number; resetAt: number }>();
const VOTE_WINDOW_MS = 60 * 60 * 1000; // 1시간
const VOTE_MAX = 30;

export function voteThrottled(ip: string): boolean {
  const now = Date.now();
  const rec = votes.get(ip);
  if (!rec || now > rec.resetAt) {
    votes.set(ip, { count: 1, resetAt: now + VOTE_WINDOW_MS });
    if (votes.size > 5000) for (const [k, v] of votes) if (now > v.resetAt) votes.delete(k);
    return false;
  }
  rec.count += 1;
  return rec.count > VOTE_MAX;
}

// 가챠 IP 총량 스로틀 — 뽑기·이용권 구매 전용. 투표 스로틀(voteThrottled, 시간당 30)과 분리:
// 이용권을 모아 1회 뽑기를 반복하는 정상 사용이 투표 한도에 걸리지 않도록 넉넉하게(시간당 120).
const gacha = new Map<string, { count: number; resetAt: number }>();
const GACHA_WINDOW_MS = 60 * 60 * 1000; // 1시간
const GACHA_MAX = 120;

export function gachaThrottled(ip: string): boolean {
  const now = Date.now();
  const rec = gacha.get(ip);
  if (!rec || now > rec.resetAt) {
    gacha.set(ip, { count: 1, resetAt: now + GACHA_WINDOW_MS });
    if (gacha.size > 5000) for (const [k, v] of gacha) if (now > v.resetAt) gacha.delete(k);
    return false;
  }
  rec.count += 1;
  return rec.count > GACHA_MAX;
}
