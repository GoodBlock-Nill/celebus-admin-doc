'use client';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center mb-6">
        <span className="text-3xl">🏠</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">홈 화면</h2>
      <p className="text-sm text-gray-500">
        기획서 작성 후 구현 예정입니다.
      </p>
    </div>
  );
}
