"use client";

// 관리자 이미지 업로드 — 파일 선택 → Supabase Storage 업로드 → 썸네일 미리보기.
import { useState } from "react";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import { getAdminPw } from "@/lib/admin-types";

export default function ImageUploader({
  value,
  onChange,
  folder = "cover",
  label = "이미지 업로드",
  className = "h-24 w-40",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: "cover" | "prize";
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (busy) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    try {
      // FormData는 content-type을 브라우저가 자동 설정하므로 authorization만 전달
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { authorization: `Bearer ${getAdminPw()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "업로드 실패");
        return;
      }
      onChange(data.url);
    } catch {
      toast.error("업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className={`${className} rounded-lg object-cover ring-1 ring-hairline`} />
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="이미지 제거"
          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-danger text-white shadow"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <label
      className={`flex ${className} cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-muted transition-colors hover:text-fg`}
    >
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <Upload className="h-5 w-5" />
          <span className="text-[11px]">{label}</span>
        </>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
