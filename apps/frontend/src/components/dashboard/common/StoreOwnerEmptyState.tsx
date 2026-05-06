import type { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

interface StoreOwnerEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function StoreOwnerEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: StoreOwnerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-xs text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
