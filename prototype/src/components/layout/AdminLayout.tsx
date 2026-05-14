import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-[256px] min-h-screen">
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
