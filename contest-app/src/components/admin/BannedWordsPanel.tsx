"use client";

// 금칙어 관리 — 관리자가 추가하는 금칙어 목록. lib/profanity.ts 기본 내장 리스트에 병합되어
// 댓글·팬 업로드·닉네임 검사에 사용된다(매칭 시 등록 차단). 변경은 서버 캐시 TTL(최대 1분) 내 반영.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import { Badge, Btn, Card, Empty, SearchInput, inputCls } from "./ui";

type Word = { word: string; created_at: string };

export default function BannedWordsPanel() {
  const [words, setWords] = useState<Word[]>([]);
  const [builtin, setBuiltin] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/banned-words");
    const j = await res.json();
    setWords(j.words ?? []);
    setBuiltin(j.builtin ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    const w = input.trim();
    if (!w || busy) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/banned-words", { method: "POST", body: JSON.stringify({ word: w }) });
    setBusy(false);
    if (res.ok) {
      toast.success("금칙어를 추가했어요.");
      setInput("");
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "추가 실패");
    }
  }

  async function remove(w: string) {
    const res = await adminFetch(`/api/admin/banned-words?word=${encodeURIComponent(w)}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("삭제했어요.");
      void load();
    } else toast.error("삭제 실패");
  }

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return kw ? words.filter((w) => w.word.toLowerCase().includes(kw)) : words;
  }, [words, q]);
  const filteredBuiltin = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return kw ? builtin.filter((w) => w.toLowerCase().includes(kw)) : builtin;
  }, [builtin, q]);

  return (
    <div className="space-y-4">
      <Card className="p-4 text-[12.5px] leading-relaxed text-muted">
        관리자가 추가하는 금칙어예요. <b className="text-fg/80">기본 내장 금칙어</b>에 병합되어 <b className="text-fg/80">댓글·팬 업로드·닉네임</b>에 적용되고, 매칭 시 등록이 차단돼요. 변경은 최대 1분 내 반영됩니다.
      </Card>

      {/* 추가 */}
      <Card className="p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            maxLength={40}
            placeholder="금칙어 입력 후 Enter 또는 추가"
            className={`${inputCls} flex-1`}
          />
          <Btn variant="primary" disabled={busy || !input.trim()} onClick={add}>
            <Plus className="h-4 w-4" /> 추가
          </Btn>
        </div>
      </Card>

      <SearchInput value={q} onChange={setQ} placeholder="금칙어 검색 (관리자 추가·기본 내장 전체)" />

      {/* 관리자 추가 — 편집 가능 */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-bold text-fg">관리자 추가</h3>
          <span className="text-[11px] font-bold text-subtle">{q ? `${filtered.length}개` : `${words.length}개`}</span>
        </div>
        {filtered.length === 0 ? (
          <Empty>{q ? "검색 결과가 없어요." : "아직 추가된 금칙어가 없어요."}</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((w) => (
              <span key={w.word} className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1.5 pl-3.5 pr-1.5 text-[13px] font-bold text-fg">
                {w.word}
                <button
                  onClick={() => void remove(w.word)}
                  aria-label={`${w.word} 삭제`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-subtle hover:bg-surface-2 hover:text-[#c0392b]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 기본 내장 — 읽기 전용(코드 레벨 안전망) */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-bold text-fg">기본 내장</h3>
          <Badge tone="gray">읽기 전용</Badge>
          <span className="text-[11px] font-bold text-subtle">{q ? `${filteredBuiltin.length}개` : `${builtin.length}개`}</span>
        </div>
        <p className="text-[11.5px] text-subtle">앱에 기본 적용되는 안전망 금칙어예요. 코드로 관리되어 여기서는 삭제할 수 없어요.</p>
        {filteredBuiltin.length === 0 ? (
          <Empty>{q ? "검색 결과가 없어요." : "내장 금칙어가 없어요."}</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredBuiltin.map((w) => (
              <span key={w} className="inline-flex items-center rounded-full bg-surface-2 px-3.5 py-1.5 text-[13px] font-bold text-muted">
                {w}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
