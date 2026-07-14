"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { TARGETS, CATEGORIES, type Target, type Category, type PostPublic } from "@/lib/types";
import { targetLabel, categoryLabel } from "@/lib/i18n";
import { useLang } from "./LangProvider";

/**
 * 작성·수정 공용 풀스크린 에디터.
 * 두 화면의 통일성을 위해 동일한 레이아웃을 쓰고,
 * 수정 모드는 비밀번호가 이미 검증되어 비밀번호 입력란만 감춘다.
 */
export default function PostEditor({
  mode,
  post,
  password,
  onClose,
  onDone,
}: {
  mode: "create" | "edit";
  post?: PostPublic; // edit 모드에서만 전달
  password?: string; // edit 모드: 이미 검증된 비밀번호
  onClose: () => void;
  onDone: (post: PostPublic) => void;
}) {
  const { t } = useLang();
  const isEdit = mode === "edit";
  const [target, setTarget] = useState<Target>(post?.target ?? "전체");
  const [category, setCategory] = useState<Category>(post?.category ?? "기타");
  const [title, setTitle] = useState(post?.title ?? "");
  const [nickname, setNickname] = useState(post?.nickname ?? "");
  const [pw, setPw] = useState("");
  const [body, setBody] = useState(post?.body ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (title.trim().length < 1) return toast.error(t("err_title"));
    if (nickname.trim().length < 1) return toast.error(t("err_nickname"));
    if (!isEdit && pw.length < 4) return toast.error(t("err_password"));
    if (body.trim().length < 2) return toast.error(t("err_body"));
    setBusy(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/posts/${post!.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password, target, category, title: title.trim(), nickname: nickname.trim(), body: body.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("err_update"));
        toast.success(t("toast_updated"));
        onDone({
          ...post!,
          target,
          category,
          title: title.trim(),
          nickname: nickname.trim(),
          body: body.trim(),
          updated_at: new Date().toISOString(),
          edited: true,
        });
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ target, category, title: title.trim(), nickname: nickname.trim(), password: pw, body: body.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("err_create"));
        toast.success(t("toast_created"));
        const now = new Date().toISOString();
        onDone({
          id: data.id,
          target,
          category,
          title: title.trim(),
          nickname: nickname.trim(),
          body: body.trim(),
          like_count: 0,
          created_at: now,
          updated_at: now,
          edited: false,
          curated: false,
          pinned: false,
          impl_status: "none",
          official_reply: null,
          comment_count: 0,
          translations: {},
        });
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t(isEdit ? "err_update" : "err_create"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-bg">
      {/* 상단 바 */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <button onClick={onClose} className="text-muted hover:text-fg" aria-label="닫기">
          <X className="h-5 w-5" />
        </button>
        <span className="text-[15px] font-bold">{isEdit ? t("m_edit_title") : t("compose_title")}</span>
        <span className="w-5" aria-hidden />
      </div>

      {/* 본문 */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto px-4 py-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {TARGETS.map((tg) => (
            <button
              key={tg}
              onClick={() => setTarget(tg)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                target === tg ? "bg-primary text-white" : "bg-card text-muted hover:text-fg"
              }`}
            >
              {targetLabel(tg, t)}
            </button>
          ))}
        </div>

        {/* 아이디어 유형 */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                category === c ? "bg-accent text-white" : "bg-card text-muted hover:text-fg"
              }`}
            >
              {categoryLabel(c, t)}
            </button>
          ))}
        </div>

        {/* 컨셉 안내 */}
        <p className="mb-3 rounded-xl border border-border/70 bg-card/50 px-3 py-2 text-[12px] leading-relaxed text-muted">
          💡 {t("compose_guide")}
        </p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 80))}
          placeholder={t("ph_title")}
          autoFocus={!isEdit}
          className="mb-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-[16px] font-bold outline-none placeholder:font-normal placeholder:text-muted focus:border-primary/50"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 500))}
          placeholder={t("ph_body")}
          className="min-h-[36vh] flex-1 resize-none rounded-2xl border border-border bg-card p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted focus:border-primary/50"
        />
        <div className="mt-1.5 mb-4 text-right text-[11px] text-muted">{body.length}/500</div>

        {isEdit ? (
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            placeholder={t("ph_nickname")}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary/50"
          />
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                placeholder={t("ph_nickname")}
                className="w-1/2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary/50"
              />
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value.slice(0, 64))}
                placeholder={t("ph_password")}
                className="w-1/2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary/50"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted">🔒 {t("pw_hint")}</p>
          </>
        )}
      </div>

      {/* 하단 액션 바 */}
      <div className="border-t border-border/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-full bg-primary py-3 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isEdit ? t("m_edit_submit") : t("submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
