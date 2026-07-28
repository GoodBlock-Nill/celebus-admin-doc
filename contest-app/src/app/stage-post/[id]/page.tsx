import { redirect, notFound } from "next/navigation";
import { anon } from "@/lib/db-anon";

// 알림 딥링크 랜딩 — 게시물이 속한 스테이지로 이동
export const dynamic = "force-dynamic";

export default async function StagePostRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await anon().from("stage_posts_public").select("stage_id").eq("id", id).maybeSingle();
  if (!data) notFound();
  redirect(`/stage/${data.stage_id}`);
}
