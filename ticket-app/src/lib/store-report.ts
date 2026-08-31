import { ACTOR_OPERATOR, MS_PER_HOUR, REPORT_SLA_HOURS } from './constants';
import { appendLog, createId, makeLog, userLabel } from './store-helpers';
import type {
  ReportActionType,
  StoreGet,
  StoreSet,
  SubmitReportInput,
  TicketStore,
} from './store-types';
import type { ReportStatus, TicketReport } from './types';

type ReportSlice = Pick<TicketStore, 'submitReport' | 'actOnReport'>;

/** 처리 액션에 따른 신고 상태 전이 (지정되지 않은 액션은 상태 유지) */
const STATUS_BY_ACTION: Partial<Record<ReportActionType, ReportStatus>> = {
  '노출 차단': 'BLOCKED',
  '수사기관 제출': 'SUBMITTED',
  종결: 'CLOSED',
};

/** 부정 거래 신고 접수·처리 액션 */
export function createReportSlice(set: StoreSet, get: StoreGet): ReportSlice {
  return {
    submitReport: (input: SubmitReportInput) => {
      const state = get();
      const nowDate = state.now();
      const report: TicketReport = {
        id: createId('report'),
        targetType: input.targetType,
        reason: input.reason,
        detail: input.detail,
        evidenceUrl: input.evidenceUrl,
        source: input.source,
        createdAt: nowDate.toISOString(),
        deadlineAt: new Date(nowDate.getTime() + REPORT_SLA_HOURS * MS_PER_HOUR).toISOString(),
        status: 'RECEIVED',
        actions: [],
      };

      set((current) => ({
        reports: [report, ...current.reports],
        logs: appendLog(
          current.logs,
          makeLog(
            input.source === '앱 신고' ? userLabel(current, current.currentUserId) : '외부 통보',
            '부정 거래 신고 접수',
            `${report.targetType} · ${report.reason} (처리 기한 ${REPORT_SLA_HOURS}시간)`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const, report };
    },

    actOnReport: (reportId, actionType) => {
      const state = get();
      const report = state.reports.find((item) => item.id === reportId);
      if (!report) return { ok: false as const, reason: '신고 내역을 찾을 수 없습니다.' };
      if (report.status === 'CLOSED') return { ok: false as const, reason: '이미 종결된 신고입니다.' };

      const nowDate = state.now();
      const nextStatus = STATUS_BY_ACTION[actionType] ?? report.status;

      set((current) => ({
        reports: current.reports.map((item) =>
          item.id === reportId
            ? {
                ...item,
                status: nextStatus,
                actions: [...item.actions, { type: actionType, at: nowDate.toISOString() }],
              }
            : item,
        ),
        logs: appendLog(
          current.logs,
          makeLog(ACTOR_OPERATOR, '신고 처리', `${report.reason} · ${actionType}`, nowDate),
        ),
      }));

      return { ok: true as const };
    },
  };
}
