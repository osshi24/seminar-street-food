'use client';

import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';

type MetricTone =
  | 'slate'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'violet';

interface AdminMetricItem {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  tone?: MetricTone;
}

const TONE_MAP: Record<MetricTone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  violet: 'bg-violet-100 text-violet-700',
};

export default function AdminMetricGrid({ items }: { items: AdminMetricItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const toneClass = TONE_MAP[item.tone ?? 'slate'];

        return (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              {item.icon ? (
                <div
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5',
                    toneClass,
                  )}
                >
                  {item.icon}
                </div>
              ) : null}
            </div>
            <div className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
              {item.value}
            </div>
            {item.description ? (
              <div className="mt-0.5 text-[11px] leading-4 text-slate-500">{item.description}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
