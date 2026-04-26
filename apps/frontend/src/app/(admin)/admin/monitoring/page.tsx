'use client';

import { useState } from 'react';
import { Activity, ScrollText } from 'lucide-react';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import MonitoringOverviewPanel from '../../../../components/admin/monitoring/MonitoringOverviewPanel';
import AuditLogPanel from '../../../../components/admin/monitoring/AuditLogPanel';
import { cn } from '../../../../lib/cn';

type Tab = 'overview' | 'audit';

const TABS: Array<{ key: Tab; label: string; icon: typeof Activity }> = [
  { key: 'overview', label: 'Tổng quan hệ thống', icon: Activity },
  { key: 'audit', label: 'Nhật ký hoạt động', icon: ScrollText },
];

export default function AdminMonitoringPage() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Giám sát"
        title="Giám sát hệ thống"
        description="Theo dõi sức khỏe backend và truy vết hành động admin theo thời gian thực."
      />

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? <MonitoringOverviewPanel /> : <AuditLogPanel />}
    </div>
  );
}
