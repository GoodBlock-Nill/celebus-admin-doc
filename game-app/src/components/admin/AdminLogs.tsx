"use client";

// 활동 로그 — 관리자 행동 + 시스템 자동 이벤트. 운영자가 한눈에 이해하도록:
//   내용=한국어 문장 / 대상=닉네임 / actor 뱃지(관리자·시스템) / 필터·검색 / 상대 시간.
import { useEffect, useMemo, useState } from "react";
import { aget } from "@/lib/admin-api";
import { Card, DataTable, TD, TR_HOVER, fmtDate } from "./ui";

type Log = {
  action: string;
  target: string | null;
  target_nickname: string | null;
  detail: Record<string, unknown> | null;
  actor: "admin" | "system" | string;
  created_at: string;
};

// 액션 한국어 라벨 (미매핑은 코드 그대로 폴백)
const ACTION_LABEL: Record<string, string> = {
  sanction: "제재",
  delete_scores: "기록 삭제",
  adjust_point: "CP 조정",
  banned_add: "금칙어 추가",
  banned_remove: "금칙어 삭제",
  config_update: "설정 변경",
  catalog_update: "가격 변경",
  set_member: "V01D 멤버",
  suspect_score: "의심 점수",
  replay_mismatch: "리플레이 불일치",
  replay_rejected: "리플레이 거부",
  replay_enforce_on: "리플레이 거부 활성",
  replay_enforce_off: "리플레이 거부 해제",
  sso_diag: "SSO 진단",
};

const MODE_LABEL: Record<string, string> = { daily: "일반 매치", free: "아이템 매치", all: "전체" };
const ITEM_LABEL: Record<string, string> = { bomb: "폭탄", line: "라인", shuffle: "셔플", time: "시간+", heart: "하트(이어하기)" };
// 설정 변경 요약용 경로 라벨 (group.field)
const CONFIG_LABEL: Record<string, string> = {
  "game.seconds": "라운드 시간(초)",
  "game.maxSeconds": "시간 상한(초)",
  "game.hintSec": "힌트 대기(초)",
  "game.timeItemSec": "시간+ 아이템(초)",
  "levels.baseTarget": "Lv.1 목표 점수",
  "levels.targetStep": "레벨당 증가",
  "levels.bonusSec": "레벨업 보너스(초)",
  "integrity.minSecPerLevel": "레벨당 최소 시간(초)",
};

const num = (v: unknown) => (typeof v === "number" ? v.toLocaleString() : String(v ?? ""));

// 설정 변경 detail(중첩 객체)을 "라운드 시간 25 · 힌트 대기 5" 식으로 요약
function summarizeConfig(detail: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [group, fields] of Object.entries(detail)) {
    if (fields && typeof fields === "object" && !Array.isArray(fields)) {
      for (const [f, v] of Object.entries(fields as Record<string, unknown>)) {
        parts.push(`${CONFIG_LABEL[`${group}.${f}`] ?? `${group}.${f}`} ${num(v)}`);
      }
    } else {
      parts.push(`${group} ${num(fields)}`);
    }
  }
  return parts.join(" · ");
}

// 로그 1건을 사람이 읽는 문장으로
function describe(l: Log): string {
  const d = l.detail ?? {};
  switch (l.action) {
    case "delete_scores":
      return `${MODE_LABEL[String(d.mode)] ?? "게임"} 기록 ${num(d.deleted)}건 삭제`;
    case "config_update":
      return Object.keys(d).length === 0 ? "설정 초기화 (기본값 복귀)" : `설정 변경 — ${summarizeConfig(d)}`;
    case "adjust_point":
      return `CP ${Number(d.delta) > 0 ? "+" : ""}${num(d.delta)}${d.reason ? ` (사유: ${d.reason})` : ""}`;
    case "sanction":
      return d.reset_nickname && d.reset_avatar
        ? "닉네임 초기화 · 아바타 제거"
        : d.reset_nickname
          ? "닉네임 초기화"
          : d.reset_avatar
            ? "아바타 제거"
            : "제재";
    case "banned_add":
      return `금칙어 추가: ${l.target ?? ""}`;
    case "banned_remove":
      return `금칙어 삭제: ${l.target ?? ""}`;
    case "catalog_update":
      return `${ITEM_LABEL[String(l.target)] ?? l.target} 가격 → ${num(d.price)} CP`;
    case "set_member":
      return d.is_member ? "V01D 멤버로 지정" : "V01D 멤버 해제";
    case "suspect_score": {
      const gap = d.gap_sec != null ? `제출 간격 ${num(d.gap_sec)}초` : d.elapsed_sec != null ? `경과 ${num(d.elapsed_sec)}초` : "";
      return `의심 점수 감지 — ${MODE_LABEL[String(d.mode)] ?? ""} · 레벨 ${num(d.level)} · ${num(d.score)}점${gap ? ` (${gap})` : ""}`;
    }
    case "replay_mismatch":
      return `리플레이 불일치${d.egregious ? " (명백)" : ""} — ${MODE_LABEL[String(d.mode)] ?? ""} 클라 ${num(d.score)}점 (서버 가능 최대 ${num(d.sim_max)} · 위법 수 ${num(d.illegal)} · 로그 ${num(d.moves)}수)`;
    case "replay_rejected":
      return `리플레이 거부 — ${MODE_LABEL[String(d.mode)] ?? ""} 클라 ${num(d.score)}점 (서버 가능 최대 ${num(d.sim_max)} · 위법 수 ${num(d.illegal)}) 저장 안 됨`;
    case "replay_enforce_on":
      return `${MODE_LABEL[String(d.mode)] ?? d.mode} 모드 리플레이 거부 자동 활성 (최근 7일 ${num(d.games_7d)}판 · 명백조작 ${d.mismatch_pct}%)`;
    case "replay_enforce_off":
      return `${MODE_LABEL[String(d.mode)] ?? d.mode} 모드 리플레이 거부 자동 해제 — 명백조작률 급등(${d.mismatch_pct}%) 안전 롤백`;
    case "sso_diag":
      return `SSO 연동 진단 — 본앱 응답 ${num(d.direct_status)}, 게임 연동 ${num(d.sso_status)}`;
    default:
      return l.detail ? JSON.stringify(l.detail) : "-";
  }
}

// 대상 표시 — 계정이면 닉네임, 그 외(금칙어·아이템)는 액션 문장에 이미 포함되므로 생략
function targetText(l: Log): string {
  if (l.target_nickname) return l.target_nickname;
  if (["banned_add", "banned_remove", "catalog_update", "config_update", "sso_diag"].includes(l.action)) return "-";
  if (l.target) return `${l.target.slice(0, 8)}… (탈퇴/미상)`;
  return "-";
}

// 상대 시간 ("방금 · N분 전 · N시간 전 · N일 전", 그 이상은 날짜)
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일 전`;
  return fmtDate(iso).slice(0, 12);
}

type LogPage = { rows: Log[]; total: number; page: number };

export default function AdminLogs() {
  const [rows, setRows] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scope, setScope] = useState<"all" | "admin" | "system">("all");
  const [action, setAction] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    aget<LogPage>("/api/admin/logs")
      .then((p) => {
        setRows(p.rows ?? []);
        setTotal(p.total ?? 0);
      })
      .catch(() => {});
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const p = await aget<LogPage>(`/api/admin/logs?offset=${rows.length}`);
    setRows((prev) => [...prev, ...(p.rows ?? [])]);
    setTotal(p.total ?? 0);
    setLoadingMore(false);
  };

  // 존재하는 액션 종류만 드롭다운에 노출
  const actionsInData = useMemo(() => Array.from(new Set(rows.map((r) => r.action))), [rows]);

  const filtered = rows.filter((l) => {
    if (scope !== "all" && l.actor !== scope) return false;
    if (action !== "all" && l.action !== action) return false;
    if (q.trim()) {
      const hay = `${l.target_nickname ?? ""} ${describe(l)}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  const ActorBadge = ({ actor }: { actor: string }) =>
    actor === "system" ? (
      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11.5px] font-bold text-gold">시스템</span>
    ) : (
      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11.5px] font-bold text-primary-400">관리자</span>
    );

  return (
    <Card
      title={`활동 로그 (전체 ${total.toLocaleString()})`}
      right={
        <div className="flex flex-wrap items-center gap-2">
          {/* 관리자/시스템 구분 */}
          <div className="flex gap-1 rounded-full bg-surface-2 p-0.5">
            {(["all", "admin", "system"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${scope === s ? "bg-primary text-white" : "text-muted"}`}
              >
                {s === "all" ? "전체" : s === "admin" ? "관리자" : "시스템"}
              </button>
            ))}
          </div>
          {/* 액션 종류 */}
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-[10px] bg-surface-2 px-3 py-1.5 text-[13px] font-bold text-fg ring-1 ring-hairline focus:outline-none"
          >
            <option value="all">모든 종류</option>
            {actionsInData.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a] ?? a}
              </option>
            ))}
          </select>
          {/* 닉네임·내용 검색 */}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="닉네임·내용 검색"
            className="rounded-[10px] bg-surface-2 px-3 py-1.5 text-[13px] text-fg ring-1 ring-hairline placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      }
    >
      <DataTable head={["구분", "종류", "대상", "내용", "시각"]}>
        {filtered.map((l, i) => (
          <tr key={i} className={TR_HOVER}>
            <td className={`${TD} whitespace-nowrap`}>
              <ActorBadge actor={l.actor} />
            </td>
            <td className={`${TD} whitespace-nowrap font-bold text-fg`}>{ACTION_LABEL[l.action] ?? l.action}</td>
            <td className={`${TD} whitespace-nowrap font-bold`}>{targetText(l)}</td>
            <td className={`${TD} max-w-[440px] truncate text-muted`} title={describe(l)}>
              {describe(l)}
            </td>
            <td className={`${TD} whitespace-nowrap text-subtle`} title={fmtDate(l.created_at)}>
              {relTime(l.created_at)}
            </td>
          </tr>
        ))}
      </DataTable>
      {filtered.length === 0 && <p className="py-6 text-center text-[13px] text-subtle">해당하는 기록이 없어요</p>}
      {rows.length < total && (
        <button
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="mt-3 w-full rounded-[10px] bg-surface-2 px-3.5 py-2 text-[13.5px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99] disabled:opacity-40"
        >
          {loadingMore ? "불러오는 중…" : `더 보기 (${rows.length.toLocaleString()} / ${total.toLocaleString()})`}
        </button>
      )}
    </Card>
  );
}
