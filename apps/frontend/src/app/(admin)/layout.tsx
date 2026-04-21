import { cookies } from 'next/headers';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminHeader from '../../components/layout/AdminHeader';
import PresenceTracker from '../../components/admin/PresenceTracker';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const collapsed = cookies().get('admin_sidebar_collapsed')?.value === '1';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PresenceTracker role="admin" />
      <div className="flex min-h-screen">
        <AdminSidebar initialCollapsed={collapsed} />
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
