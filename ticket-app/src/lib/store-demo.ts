import { ACTOR_SYSTEM, MS_PER_MINUTE } from './constants';
import { makeDi } from './di';
import { createSeedState } from './seed';
import { appendLog, makeLog, userLabel } from './store-helpers';
import type { StoreGet, StoreSet, TicketStore, VerifyIdentityInput } from './store-types';

type DemoSlice = Pick<
  TicketStore,
  'now' | 'advanceTime' | 'resetTime' | 'switchUser' | 'verifyIdentity' | 'resetDemo'
>;

/** 데모 진행(시간 이동·사용자 전환·본인확인·초기화) 액션 */
export function createDemoSlice(set: StoreSet, get: StoreGet): DemoSlice {
  const now = (): Date => new Date(Date.now() + get().demoOffsetMs);

  return {
    now,

    advanceTime: (ms) => {
      set((state) => ({
        demoOffsetMs: state.demoOffsetMs + ms,
        logs: appendLog(
          state.logs,
          makeLog(ACTOR_SYSTEM, '데모 시간 이동', `${Math.round(ms / MS_PER_MINUTE)}분 이동`, now()),
        ),
      }));
    },

    resetTime: () => {
      set((state) => ({
        demoOffsetMs: 0,
        logs: appendLog(state.logs, makeLog(ACTOR_SYSTEM, '데모 시간 초기화', '현재 시각으로 복귀', new Date())),
      }));
    },

    switchUser: (userId) => {
      set((state) =>
        state.users.some((user) => user.id === userId) ? { currentUserId: userId } : {},
      );
    },

    verifyIdentity: (input: VerifyIdentityInput) => {
      const state = get();
      const di = makeDi(input.realName, input.birth, input.phone);
      const duplicated = state.verifications.some(
        (item) => item.di === di && item.userId !== state.currentUserId,
      );
      if (duplicated) return { ok: false as const, reason: '중복' as const };

      const verifiedAt = now().toISOString();
      const nextVerification = {
        userId: state.currentUserId,
        realName: input.realName.trim(),
        birth: input.birth.trim(),
        phone: input.phone.trim(),
        di,
        verifiedAt,
      };

      set((current) => ({
        verifications: [
          ...current.verifications.filter((item) => item.userId !== current.currentUserId),
          nextVerification,
        ],
        logs: appendLog(
          current.logs,
          makeLog(
            userLabel(current, current.currentUserId),
            '본인확인 완료',
            `${nextVerification.realName} 명의로 본인확인을 마쳤습니다.`,
            now(),
          ),
        ),
      }));

      return { ok: true as const };
    },

    resetDemo: () => {
      const seeded = createSeedState(Date.now());
      set(() => ({ ...seeded }));
    },
  };
}
