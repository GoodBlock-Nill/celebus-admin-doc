import Shell from "@/components/Shell";
import HomeServer from "@/components/HomeServer";
import { getServerLang } from "@/lib/server-lang";

// 홈은 서버 렌더(HomeServer) — 데이터를 기다렸다가 히어로 이미지를 포함한 완성 HTML을 응답에 담아
// LCP 이미지를 초기 HTML로 확정(스트리밍 스켈레톤 없이). 데이터는 home-data의 unstable_cache(30s)로 캐시.
export default async function HomePage() {
  const lang = await getServerLang();
  return (
    <Shell initialLang={lang}>
      <HomeServer />
    </Shell>
  );
}
