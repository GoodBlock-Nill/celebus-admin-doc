"use client";

// 금칙어 — 닉네임에 이 단어가 포함(부분일치)되면 랭킹에서 '익명'으로 표시.
// 추가 전 영향 미리보기(포함 회원 수·예시)로 짧은 단어의 오탐을 방지.
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { BTN, Card, INPUT } from "./ui";

type Word = { word: string; affected: number };
type Preview = { count: number; samples: string[] };

export default function AdminBanned() {
  const [words, setWords] = useState<Word[]>([]);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => setWords(await aget<Word[]>("/api/admin/banned"));
  useEffect(() => {
    void load();
  }, []);

  // 입력 디바운스 → 영향 미리보기
  useEffect(() => {
    const w = input.trim();
    if (timer.current) clearTimeout(timer.current);
    if (!w) {
      setPreview(null);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        setPreview(await aget<Preview>(`/api/admin/banned?preview=${encodeURIComponent(w)}`));
      } catch {
        setPreview(null);
      }
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [input]);

  const add = async () => {
    const w = input.trim().toLowerCase();
    if (!w) return;
    if (words.some((x) => x.word === w)) {
      setMsg("이미 등록된 단어예요.");
      return;
    }
    await asend("/api/admin/banned", "POST", { word: w });
    setMsg(`'${w}' 추가했어요.`);
    setInput("");
    setPreview(null);
    await load();
  };

  const remove = async (w: string) => {
    await asend(`/api/admin/banned?word=${encodeURIComponent(w)}`, "DELETE");
    setMsg(`'${w}' 삭제했어요.`);
    await load();
  };

  return (
    <Card title={`금칙어 (${words.length})`}>
      <p className="mb-3 text-[12.5px] leading-relaxed text-muted">
        닉네임에 이 단어가 <b className="text-fg">포함(부분일치)</b>되면 랭킹에서 자동으로 <b className="text-fg">&lsquo;익명&rsquo;</b>으로 표시돼요.
        닉네임 자체는 CELEBUS 계정 값이라 바뀌지 않아요. <b className="text-gold">짧은 단어는 오탐에 주의</b>하세요(예: &lsquo;ass&rsquo;는 &lsquo;bass&rsquo;도 걸림).
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="추가할 단어 (소문자·30자)" className={`${INPUT} flex-1`} />
          <button type="submit" className={BTN}>
            추가
          </button>
        </div>
        {/* 영향 미리보기 */}
        {input.trim() && preview && (
          <div className={`mt-2 rounded-[10px] px-3.5 py-2.5 text-[12.5px] ${preview.count > 0 ? "bg-danger/10 text-danger" : "bg-surface-2 text-muted"}`}>
            {preview.count > 0 ? (
              <>
                <b>현재 {preview.count}명</b>의 닉네임에 포함돼요 (랭킹에서 익명 처리됨)
                {preview.samples.length > 0 && <span className="text-subtle"> · 예: {preview.samples.join(", ")}</span>}
              </>
            ) : (
              "현재 이 단어가 포함된 닉네임은 없어요."
            )}
          </div>
        )}
      </form>

      {msg && <p className="mt-2 text-[12.5px] font-bold text-primary-400">{msg}</p>}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {words.map((w) => (
          <span key={w.word} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pl-3 pr-1 text-[13px] font-bold ring-1 ring-hairline">
            {w.word}
            {w.affected > 0 && <span className="rounded-full bg-danger/15 px-1.5 text-[10.5px] font-bold text-danger">{w.affected}명</span>}
            <button
              aria-label={`${w.word} 삭제`}
              onClick={() => void remove(w.word)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-subtle transition-colors hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {words.length === 0 && <p className="text-[13px] text-subtle">등록된 금칙어가 없어요.</p>}
      </div>
    </Card>
  );
}
