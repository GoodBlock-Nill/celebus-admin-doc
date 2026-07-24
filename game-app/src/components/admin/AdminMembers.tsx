"use client";

// 회원 관리 — 검색 → 상세(지갑·인벤·베스트·원장) → 제재(닉네임 초기화·아바타 제거)·기록 삭제·CP 조정
import { useEffect, useState } from "react";
import { aget, asend } from "@/lib/admin-api";
import Avatar from "../Avatar";
import { BTN, BTN_DANGER, BTN_GHOST, Card, INPUT, fmtDate } from "./ui";

type Row = {
  player_hash: string;
  nickname: string;
  phone_cc: string;
  phone: string;
  avatar: string | null;
  created_at: string;
  last_login_at: string | null;
  is_member?: boolean; // V01D 멤버
};

type Detail = {
  profile: Row | null;
  celeb_point: number | null;
  inventory: Record<string, number>;
  best_normal: { level: number; score: number } | null;
  best_item: { level: number; score: number } | null;
  scores_count: number;
  ledger: { delta: number; reason: string; created_at: string }[];
};

export default function AdminMembers() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [cpDelta, setCpDelta] = useState("");
  const [cpReason, setCpReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const search = async () => {
    setRows(await aget<Row[]>(`/api/admin/profiles?q=${encodeURIComponent(q)}`));
  };
  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async (h: string) => {
    setSel(h);
    setMsg(null);
    setDetail(await aget<Detail>(`/api/admin/profile?h=${h}`));
  };

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg(done);
      if (sel) await open(sel);
      await search();
    } catch {
      setMsg("실패했어요. 다시 시도해주세요.");
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card title="회원 검색">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="닉네임 또는 전화번호" className={`${INPUT} flex-1`} />
          <button type="submit" className={BTN}>
            검색
          </button>
        </form>
        <div className="mt-3 flex flex-col gap-1.5">
          {rows.map((r) => (
            <button
              key={r.player_hash}
              onClick={() => void open(r.player_hash)}
              className={`flex items-center gap-3 rounded-[12px] px-3 py-2 text-left ring-1 ${
                sel === r.player_hash ? "bg-primary/12 ring-primary/30" : "bg-surface-2 ring-hairline"
              }`}
            >
              <Avatar value={r.avatar} size="sm" />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate text-[13px] font-bold">{r.nickname}</span>
                {r.is_member && <span className="shrink-0 rounded-[4px] bg-primary px-1 py-0.5 text-[8px] font-black leading-none text-white">V01D</span>}
              </span>
              <span className="text-[11px] tabular-nums text-subtle">
                {r.phone_cc} {r.phone}
              </span>
              <span className="text-[10.5px] text-subtle">{fmtDate(r.created_at).slice(0, 12)}</span>
            </button>
          ))}
          {rows.length === 0 && <p className="py-4 text-center text-[12px] text-subtle">결과 없음</p>}
        </div>
      </Card>

      {detail?.profile && (
        <Card title={`상세 — ${detail.profile.nickname}`}>
          <div className="flex items-center gap-3">
            <Avatar value={detail.profile.avatar} size="lg" />
            <div className="min-w-0 flex-1 text-[12px] leading-relaxed text-muted">
              <div className="flex items-center gap-1.5 text-[14px] font-black text-fg">
                {detail.profile.nickname}
                {detail.profile.is_member && <span className="rounded-[4px] bg-primary px-1 py-0.5 text-[8px] font-black leading-none text-white">V01D</span>}
              </div>
              <div>
                {detail.profile.phone_cc} {detail.profile.phone} · 가입 {fmtDate(detail.profile.created_at)}
              </div>
              <div>최근 로그인 {fmtDate(detail.profile.last_login_at)}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
            <div className="rounded-[10px] bg-surface-2 p-2">
              CP <b className="tabular-nums">{(detail.celeb_point ?? 0).toLocaleString()}</b>
            </div>
            <div className="rounded-[10px] bg-surface-2 p-2">
              게임 수 <b className="tabular-nums">{detail.scores_count}</b>
            </div>
            <div className="rounded-[10px] bg-surface-2 p-2">
              일반 {detail.best_normal ? `Lv.${detail.best_normal.level}·${detail.best_normal.score.toLocaleString()}` : "-"}
            </div>
            <div className="rounded-[10px] bg-surface-2 p-2">
              아이템 {detail.best_item ? `Lv.${detail.best_item.level}·${detail.best_item.score.toLocaleString()}` : "-"}
            </div>
          </div>

          {/* 제재·기록 삭제 */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() =>
                act(() => asend("/api/admin/sanction", "POST", { player_hash: sel, reset_nickname: true }), "닉네임을 초기화했어요.")
              }
              className={BTN_DANGER}
            >
              닉네임 초기화
            </button>
            <button
              disabled={busy}
              onClick={() =>
                act(() => asend("/api/admin/sanction", "POST", { player_hash: sel, reset_avatar: true }), "아바타를 제거했어요.")
              }
              className={BTN_DANGER}
            >
              아바타 제거
            </button>
            <button
              disabled={busy}
              onClick={() => act(() => asend("/api/admin/scores-delete", "POST", { player_hash: sel }), "전체 기록을 삭제했어요.")}
              className={BTN_DANGER}
            >
              기록 전체 삭제
            </button>
            <button
              disabled={busy}
              onClick={() =>
                act(
                  () => asend("/api/admin/member-flag", "POST", { player_hash: sel, is_member: !detail.profile?.is_member }),
                  detail.profile?.is_member ? "V01D 멤버를 해제했어요." : "V01D 멤버로 지정했어요.",
                )
              }
              className={detail.profile.is_member ? BTN_DANGER : BTN}
            >
              {detail.profile.is_member ? "V01D 멤버 해제" : "V01D 멤버 지정"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                // 임시 비밀번호 생성 → 재설정 → 화면 표시 (전화번호 대조 후 유저에게 전달)
                const tmp = "cm-" + Math.random().toString(36).slice(2, 10);
                void act(async () => {
                  await asend("/api/admin/reset-password", "POST", { player_hash: sel, new_password: tmp });
                }, `임시 비밀번호로 재설정했어요: ${tmp} (유저에게 전달 후 변경 안내)`);
              }}
              className={BTN_GHOST}
            >
              비밀번호 재설정
            </button>
          </div>

          {/* CP 지급/회수 */}
          <form
            className="mt-3 flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const d = parseInt(cpDelta, 10);
              if (!d || !cpReason.trim()) return;
              void act(() => asend("/api/admin/point", "POST", { player_hash: sel, delta: d, reason: cpReason.trim() }), "CP를 조정했어요.");
            }}
          >
            <input value={cpDelta} onChange={(e) => setCpDelta(e.target.value.replace(/[^\d-]/g, ""))} placeholder="+지급 / -회수" className={`${INPUT} w-32`} />
            <input value={cpReason} onChange={(e) => setCpReason(e.target.value)} placeholder="사유 (원장 기록)" className={`${INPUT} flex-1`} />
            <button type="submit" disabled={busy} className={BTN_GHOST}>
              CP 조정
            </button>
          </form>

          {msg && <p className="mt-2 text-[12px] font-bold text-primary-400">{msg}</p>}

          {/* 원장 */}
          <div className="mt-3">
            <div className="mb-1 text-[11px] font-bold text-subtle">CP 원장 (최근 20)</div>
            <div className="flex flex-col gap-1">
              {detail.ledger.map((l, i) => (
                <div key={i} className="flex items-center justify-between rounded-[8px] bg-surface-2 px-2.5 py-1.5 text-[11.5px]">
                  <span className={`font-black tabular-nums ${l.delta > 0 ? "text-verified" : "text-danger"}`}>
                    {l.delta > 0 ? "+" : ""}
                    {l.delta.toLocaleString()}
                  </span>
                  <span className="flex-1 truncate px-2 text-muted">{l.reason}</span>
                  <span className="text-subtle">{fmtDate(l.created_at)}</span>
                </div>
              ))}
              {detail.ledger.length === 0 && <p className="text-[12px] text-subtle">기록 없음</p>}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
