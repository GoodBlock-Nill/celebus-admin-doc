import AdminSidebar from '@/components/layout/AdminSidebar';
import ToastContainer from '@/components/ui/Toast';
import PrelineScript from '@/components/PrelineScript';

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-[220px] p-8">
        <div className="max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
      <ToastContainer />
      <PrelineScript />
    </div>
  );
}
