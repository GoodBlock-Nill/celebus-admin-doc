import { redirect } from "next/navigation";

// 레거시 딥링크 별칭 — 영상 상세 라우트로 이동 (Wave 9)
export const dynamic = "force-dynamic";

export default async function StagePostRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/video/${id}`);
}
