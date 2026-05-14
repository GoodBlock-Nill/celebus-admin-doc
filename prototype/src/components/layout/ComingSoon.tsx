interface ComingSoonProps {
  area: string;
  description?: string;
}

export default function ComingSoon({ area, description }: ComingSoonProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl border-dashed p-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">준비 중인 기능입니다</h3>
      <p className="text-sm text-gray-500">{description || `${area} 페이지는 현재 개발 중에 있습니다.`}</p>
    </div>
  );
}
