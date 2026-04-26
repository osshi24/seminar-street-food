import type { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function AdminEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-9 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-xs text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
