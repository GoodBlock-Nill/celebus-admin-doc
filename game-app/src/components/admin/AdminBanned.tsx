"use client";

// 금칙어 관리 — 가입 거절·점수 제출 닉네임 '익명' 치환에 공용 적용
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { BTN, Card, INPUT } from "./ui";

export default function AdminBanned() {
  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const load = async () => setWords(await aget<string[]>("/api/admin/banned"));
  useEffect(() => {
    void load();
  }, []);

  return (
    <Card title={`금칙어 (${words.length})`}>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const w = input.trim();
          if (!w) return;
          await asend("/api/admin/banned", "POST", { word: w });
          setInput("");
          await load();
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="추가할 단어" className={`${INPUT} flex-1`} />
        <button type="submit" className={BTN}>
          추가
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {words.map((w) => (
          <span key={w} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pl-3 pr-1 text-[12px] font-bold">
            {w}
            <button
              aria-label={`${w} 삭제`}
              onClick={async () => {
                await asend(`/api/admin/banned?word=${encodeURIComponent(w)}`, "DELETE");
                await load();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-subtle hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
    </Card>
  );
}
