import { BannerToastViewport } from '@/components/home/BannerModals';

// [CEB-BO-APP-201] v6.8 정합 — 배너 영역 공통 Toast Viewport 일괄 마운트
// 위치·자동 닫힘은 [CEB-BO-000] §공통 토스트 규격 준수
export default function BannersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BannerToastViewport />
    </>
  );
}
