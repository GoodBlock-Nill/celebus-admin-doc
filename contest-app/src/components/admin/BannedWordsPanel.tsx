"use client";

// 금칙어 관리 — 관리자가 추가하는 금칙어 목록. lib/profanity.ts 기본 내장 리스트에 병합되어
// 댓글·팬 업로드·닉네임 검사에 사용된다(매칭 시 등록 차단). 변경은 서버 캐시 TTL(최대 1분) 내 반영.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import { Btn, Card, Empty, SearchInput, inputCls } from "./ui";

type Word = { word: string; created_at: string };

export default function BannedWordsPanel() {
  const [words, setWords] = useState<Word[]>([]);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/banned-words");
    const j = await res.json();
    setWords(j.words ?? []);
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

      <SearchInput value={q} onChange={setQ} placeholder="금칙어 검색" />
      <div className="text-[12px] font-bold text-muted">
        {q ? `‘${q}’ 검색결과 ${filtered.length.toLocaleString()}개` : `등록된 금칙어 ${words.length.toLocaleString()}개`}
      </div>

      {filtered.length === 0 ? (
        <Empty>{q ? "검색 결과가 없어요." : "아직 추가된 금칙어가 없어요. (기본 내장 금칙어는 계속 적용돼요)"}</Empty>
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
    </div>
  );
}
