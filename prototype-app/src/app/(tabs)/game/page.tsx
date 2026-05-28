import AppHeader from '@/components/layout/AppHeader';
import { Gamepad2 } from 'lucide-react';

export default function GamePage() {
  return (
    <div>
      <AppHeader />
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-32 text-center">
        <Gamepad2 className="size-12 text-text-disabled" />
        <p className="text-[15px] font-semibold">게임존</p>
        <p className="text-[13px] text-text-body">곧 만나요! 기대해 주세요</p>
      </div>
    </div>
  );
}
