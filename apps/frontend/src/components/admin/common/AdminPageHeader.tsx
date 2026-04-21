'use client';

import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
}

export default function AdminPageHeader({
  badge,
  title,
  description,
  meta,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-3.5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 max-w-3xl">
        {badge ? (
          <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider text-cyan-700">
            {badge}
          </span>
        ) : null}
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        ) : null}
        {meta ? <div className="mt-1.5 text-xs text-slate-400">{meta}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
