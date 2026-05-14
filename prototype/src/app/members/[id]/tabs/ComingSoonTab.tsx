import {
  FolderIcon,
  UsersIcon,
  TicketIcon,
  WalletIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  프로젝트: FolderIcon,
  Fans: UsersIcon,
  티켓: TicketIcon,
  지갑: WalletIcon,
  활동내역: ClockIcon,
};

export default function ComingSoonTab({ area }: { area: string }) {
  const Icon = ICONS[area] || FolderIcon;
  return (
    <div className="bg-white border border-gray-200 border-dashed rounded-xl p-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">준비 중인 기능입니다</h3>
      <p className="text-sm text-gray-500">{area} 탭은 현재 개발 중에 있습니다.</p>
    </div>
  );
}
