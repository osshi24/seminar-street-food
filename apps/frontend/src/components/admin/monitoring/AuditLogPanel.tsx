'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter } from 'lucide-react';
import {
  getAuditLogs,
  type AuditLogItem,
  type AuditLogQueryParams,
  type AuditLogResponse,
} from '../../../lib/api/admin-monitoring';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

const ROLE_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'muted'> = {
  admin: 'default',
  store_owner: 'info',
  customer: 'success',
  system: 'muted',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AuditLogPanel() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogQueryParams>({});
  const [actionFilter, setActionFilter] = useState('');
  const [actorRoleFilter, setActorRoleFilter] = useState('');

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit],
  );

  const load = async (params: AuditLogQueryParams) => {
    setLoading(true);
    try {
      const res: AuditLogResponse = await getAuditLogs(params);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load({ ...filters, page, limit });
  }, [page, filters, limit]);

  const applyFilters = () => {
    const next: AuditLogQueryParams = {};
    if (actionFilter.trim()) next.action = actionFilter.trim();
    if (actorRoleFilter.trim()) next.actorRole = actorRoleFilter.trim();
    setPage(1);
    setFilters(next);
  };

  const resetFilters = () => {
    setActionFilter('');
    setActorRoleFilter('');
    setPage(1);
    setFilters({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhật ký hoạt động</CardTitle>
        <CardDescription>
          Theo dõi hành động của admin/chủ gian hàng (ẩn/duyệt/xoá nội dung).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Action</label>
            <input
              type="text"
              placeholder="vd: review.hide"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Vai trò</label>
            <select
              value={actorRoleFilter}
              onChange={(e) => setActorRoleFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="admin">Admin</option>
              <option value="store_owner">Chủ gian hàng</option>
              <option value="customer">Khách hàng</option>
              <option value="system">System</option>
            </select>
          </div>
          <Button size="sm" onClick={applyFilters}>
            <Filter className="mr-1 h-3.5 w-3.5" /> Lọc
          </Button>
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Bỏ lọc
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-md bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            Không có nhật ký nào khớp bộ lọc.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-2 py-2 font-medium">Thời gian</th>
                  <th className="px-2 py-2 font-medium">Vai trò</th>
                  <th className="px-2 py-2 font-medium">Người thực hiện</th>
                  <th className="px-2 py-2 font-medium">Action</th>
                  <th className="px-2 py-2 font-medium">Đối tượng</th>
                  <th className="px-2 py-2 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.id}
                    className="border-b border-slate-100 last:border-0 align-top"
                  >
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-slate-500">
                      {formatDateTime(it.ts)}
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant={ROLE_VARIANT[it.actorRole] ?? 'muted'}>
                        {it.actorRole}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-slate-900">
                      {it.actorName ?? <span className="text-slate-400">—</span>}
                      {it.ip ? (
                        <p className="text-[11px] text-slate-400">IP: {it.ip}</p>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-slate-700">
                      {it.action}
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-700">
                      {it.resourceType ? (
                        <>
                          <span className="font-medium">{it.resourceType}</span>
                          {it.resourceId ? (
                            <span className="block truncate text-[11px] text-slate-400">
                              {it.resourceId}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-500">
                      {it.metadata ? (
                        <pre className="max-w-[260px] truncate font-mono text-[11px] text-slate-500">
                          {JSON.stringify(it.metadata)}
                        </pre>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <p>
            Tổng {total} bản ghi · trang {page}/{totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
