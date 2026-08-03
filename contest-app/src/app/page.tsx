import { Suspense } from "react";
import Shell from "@/components/Shell";
import HomeServer from "@/components/HomeServer";
import { LoadingSkeleton } from "@/components/HomeAtoms";
import { getServerLang } from "@/lib/server-lang";

// 홈은 서버 렌더(HomeServer) — 히어로 이미지를 초기 HTML에 포함해 LCP/CLS 개선.
// 쿠키(언어)를 읽으므로 동적 렌더이나, 홈 데이터는 home-data의 unstable_cache(30s)로 공유 캐시.
export default async function HomePage() {
  const lang = await getServerLang();
  return (
    <Shell initialLang={lang}>
      <Suspense fallback={<LoadingSkeleton />}>
        <HomeServer />
      </Suspense>
    </Shell>
  );
}
