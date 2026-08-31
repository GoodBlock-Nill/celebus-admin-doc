import type { CompPoolType } from '@/lib/admin-types';
import type { PoolType } from '@/lib/api-types';

/** 화면 표기 순서 — 유상 판매분을 맨 앞에 둔다. */
export const POOL_TYPES: PoolType[] = [
  'PAID_SALE',
  'CELEBUS_WINNER',
  'IX_INVITATION',
  'OPERATION_HOLD',
];

/** 무상 발급이 가능한 분류 */
export const COMP_POOL_TYPES: CompPoolType[] = [
  'CELEBUS_WINNER',
  'IX_INVITATION',
  'OPERATION_HOLD',
];

export function isPoolType(value: string): value is PoolType {
  return (POOL_TYPES as string[]).includes(value);
}

export function isCompPoolType(value: string): value is CompPoolType {
  return (COMP_POOL_TYPES as string[]).includes(value);
}
