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
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
      <div className="absolute inset-y-0 right-0 hidden w-64 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.08),_transparent_60%)] lg:block" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {badge ? (
            <span className="inline-flex w-fit items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              {badge}
            </span>
          ) : null}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {meta ? <div className="text-sm text-slate-500">{meta}</div> : null}
        </div>
        {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
