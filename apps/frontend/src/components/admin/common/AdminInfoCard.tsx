import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface AdminInfoCardProps {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}

export default function AdminInfoCard({ title, icon: Icon, action, children }: AdminInfoCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 text-slate-700">
              <Icon className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}
