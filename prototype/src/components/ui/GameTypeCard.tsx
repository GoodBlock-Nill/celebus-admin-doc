import Link from 'next/link';
import { ArrowRightIcon, WrenchScrewdriverIcon } from '@heroicons/react/20/solid';

interface GameTypeCardProps {
  name: string;
  href: string;
  disabled?: boolean;
  comingSoon?: boolean;
  stats?: { label: string; value: string }[];
}

export default function GameTypeCard({ name, href, disabled = false, comingSoon = false, stats = [] }: GameTypeCardProps) {
  if (comingSoon) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">{name}</h3>
            <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              준비중
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <WrenchScrewdriverIcon className="h-10 w-10 mb-3" />
          <p className="text-base font-medium text-gray-500">준비중</p>
          <p className="text-sm mt-1">Phase 2.5에서 제공 예정입니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          {disabled && (
            <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              준비중
            </span>
          )}
        </div>
        {disabled ? (
          <span className="text-sm text-gray-400">바로가기 →</span>
        ) : (
          <Link href={href} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            바로가기 <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{stat.label}</span>
            <span className="text-sm font-medium text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
