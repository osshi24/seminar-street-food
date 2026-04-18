'use client';

import type { ReactNode } from 'react';

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

const TONE_MAP: Record<
  MetricTone,
  { card: string; ring: string; icon: string; label: string; value: string }
> = {
  slate: {
    card: 'from-white to-slate-50',
    ring: 'ring-slate-200/80',
    icon: 'bg-slate-900 text-white',
    label: 'text-slate-500',
    value: 'text-slate-950',
  },
  blue: {
    card: 'from-blue-50 to-white',
    ring: 'ring-blue-200/80',
    icon: 'bg-blue-600 text-white',
    label: 'text-blue-700',
    value: 'text-blue-950',
  },
  emerald: {
    card: 'from-emerald-50 to-white',
    ring: 'ring-emerald-200/80',
    icon: 'bg-emerald-600 text-white',
    label: 'text-emerald-700',
    value: 'text-emerald-950',
  },
  amber: {
    card: 'from-amber-50 to-white',
    ring: 'ring-amber-200/80',
    icon: 'bg-amber-500 text-white',
    label: 'text-amber-700',
    value: 'text-amber-950',
  },
  rose: {
    card: 'from-rose-50 to-white',
    ring: 'ring-rose-200/80',
    icon: 'bg-rose-600 text-white',
    label: 'text-rose-700',
    value: 'text-rose-950',
  },
  cyan: {
    card: 'from-cyan-50 to-white',
    ring: 'ring-cyan-200/80',
    icon: 'bg-cyan-600 text-white',
    label: 'text-cyan-700',
    value: 'text-cyan-950',
  },
  violet: {
    card: 'from-violet-50 to-white',
    ring: 'ring-violet-200/80',
    icon: 'bg-violet-600 text-white',
    label: 'text-violet-700',
    value: 'text-violet-950',
  },
};

export default function AdminMetricGrid({ items }: { items: AdminMetricItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const tone = TONE_MAP[item.tone ?? 'slate'];

        return (
          <div
            key={item.label}
            className={`rounded-[28px] bg-gradient-to-br p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] ring-1 ${tone.card} ${tone.ring}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${tone.label}`}>
                  {item.label}
                </p>
                <div className={`mt-3 text-3xl font-semibold leading-none ${tone.value}`}>
                  {item.value}
                </div>
              </div>
              {item.icon ? (
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone.icon}`}>
                  {item.icon}
                </div>
              ) : null}
            </div>
            {item.description ? (
              <div className="mt-4 text-sm leading-6 text-slate-500">{item.description}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
