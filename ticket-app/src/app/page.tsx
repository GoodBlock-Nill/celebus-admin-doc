import { redirect } from 'next/navigation';

// 루트는 회원 예매 화면으로 바로 진입한다.
// 관리자 영역(/admin)은 링크로 노출하지 않고 직접 URL + 로그인으로만 접근한다.
export default function RootPage() {
  redirect('/app');
}
