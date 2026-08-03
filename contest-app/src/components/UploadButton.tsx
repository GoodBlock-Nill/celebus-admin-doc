"use client";

// 업로드 버튼 — 홈(서버 렌더) 안의 클라이언트 섬. 로그인 유도 + 업로드 시트를 자체 관리.
import { useState } from "react";
import { Plus } from "lucide-react";
import { useSession } from "./SessionProvider";
import GlobalUploadSheet from "./GlobalUploadSheet";

export default function UploadButton({ label, className }: { label: string; className?: string }) {
  const { requireLogin } = useSession();
  const [open, setOpen] = useState(false);
  const openUpload = () => {
    if (!requireLogin(() => setOpen(true))) return;
    setOpen(true);
  };
  return (
    <>
      <button
        onClick={openUpload}
        className={
          className ??
          "inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-6 text-[14px] font-bold text-white active:scale-[0.98]"
        }
      >
        <Plus className="h-4 w-4" strokeWidth={2.6} /> {label}
      </button>
      {open && <GlobalUploadSheet onClose={() => setOpen(false)} />}
    </>
  );
}
