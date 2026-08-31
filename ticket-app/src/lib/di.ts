/**
 * 본인확인 중복 식별값(DI) 모의 생성기.
 * 실제 서비스의 DI는 본인확인 기관이 발급하지만, 데모에서는
 * 실명·생년월일·휴대폰번호 조합으로 결정적(같은 입력 = 같은 값) 문자열을 만든다.
 */

const HEX_LENGTH = 32;
const SEGMENT_COUNT = 4;
const SEGMENT_HEX_LENGTH = HEX_LENGTH / SEGMENT_COUNT;
const HEX_RADIX = 16;
const INITIAL_SEEDS = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x7feb352d];
const PRIME_MULTIPLIER = 16777619;
const UNSIGNED_MASK = 0xffffffff;

function normalize(value: string): string {
  return value.replace(/[\s-]/g, '').toLowerCase();
}

/** 32비트 FNV 계열 해시 — 시드에 따라 서로 다른 다이제스트 조각을 만든다. */
function hash32(input: string, seed: number): number {
  let acc = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    acc ^= input.charCodeAt(i);
    acc = Math.imul(acc, PRIME_MULTIPLIER) >>> 0;
  }
  return (acc ^ (acc >>> 15)) >>> 0;
}

/** 실명·생년월일·휴대폰번호로 32자리 16진수 유사 DI를 만든다. */
export function makeDi(realName: string, birth: string, phone: string): string {
  const source = [normalize(realName), normalize(birth), normalize(phone)].join('|');
  return INITIAL_SEEDS.map((seed) =>
    (hash32(source, seed) & UNSIGNED_MASK).toString(HEX_RADIX).padStart(SEGMENT_HEX_LENGTH, '0'),
  ).join('');
}
