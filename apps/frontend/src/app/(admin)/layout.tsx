import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)]">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
