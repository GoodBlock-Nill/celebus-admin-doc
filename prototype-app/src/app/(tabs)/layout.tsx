import BottomNav from '@/components/layout/BottomNav';

export const dynamic = 'force-dynamic';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 pb-2">{children}</div>
      <BottomNav />
    </div>
  );
}
