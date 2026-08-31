import 'server-only';

// 개인정보 보관 유틸 (설계서 §7.2)
//  · 전화번호 등 재사용이 필요한 값 → AES-256-GCM 암호화 저장, 응답은 마스킹만 반환
//  · 중복 가입 차단용 식별값 → 단방향 해시(복호 불가)로 저장하고 UNIQUE 제약으로 차단
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

import { ticketSalt } from './hash';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;
const ENCRYPTED_PREFIX = 'v1';

function encryptionKey(): Buffer {
  const raw = process.env.TICKET_ENC_KEY;
  if (!raw) throw new Error('개인정보 암호화 키가 없습니다 (TICKET_ENC_KEY).');

  const key = Buffer.from(raw, 'hex');
  if (key.length !== KEY_BYTES) throw new Error('개인정보 암호화 키는 32바이트 16진수여야 합니다.');
  return key;
}

/** 평문 → "v1:초기벡터:인증태그:암호문" (전부 16진수) */
export function encryptText(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [ENCRYPTED_PREFIX, iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join(':');
}

/** 암호문 복호 — 형식이 다르거나 검증 실패면 null */
export function decryptText(stored: string | null | undefined): string | null {
  if (!stored) return null;

  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== ENCRYPTED_PREFIX) return null;

  try {
    const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(parts[1], 'hex'));
    decipher.setAuthTag(Buffer.from(parts[2], 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(parts[3], 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

/** 실명·생년월일·휴대폰번호 정규화 — 공백·하이픈 제거 + 소문자 */
function normalize(value: string): string {
  return value.replace(/[\s-]/g, '').toLowerCase();
}

/**
 * 중복 가입 차단 식별값(해시).
 *
 * ⚠️ W1은 모의 간편인증 단계라 실명·생년월일·휴대폰번호 조합의 결정적 해시로 대체한다.
 *    간편인증 대행사 실연동 시 이 함수 대신 `diHashFromProvider`로 교체하면 되도록
 *    "식별값 → 해시" 경계를 분리해 두었다. 저장 형태(해시 문자열)는 동일하다.
 */
export function makeDiHash(realName: string, birth: string, phone: string): string {
  const source = [normalize(realName), normalize(birth), normalize(phone)].join('|');
  return createHash('sha256').update(`${ticketSalt()}:ticket-di:${source}`).digest('hex');
}

/** 대행사가 반환한 실제 중복 가입 확인 정보(DI)를 저장용 해시로 변환 (실연동 시 사용) */
export function diHashFromProvider(di: string): string {
  return createHash('sha256').update(`${ticketSalt()}:ticket-di-provider:${di}`).digest('hex');
}
