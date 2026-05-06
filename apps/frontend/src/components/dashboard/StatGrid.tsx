'use client';

import type { ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type StatTone = 'neutral' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'orange';

export interface StatItem {
  label: string;
  value: ReactNode;
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  helperText?: ReactNode;
  tone?: StatTone;
}

const TONE_STYLES: Record<
  StatTone,
  { iconBg: string; iconText: string; valueAccent: string; ring: string }
> = {
  neutral: {
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    valueAccent: 'text-slate-900',
    ring: 'ring-slate-200',
  },
  blue: {
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-700',
    valueAccent: 'text-blue-700',
    ring: 'ring-blue-200/70',
  },
  emerald: {
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-700',
    valueAccent: 'text-emerald-700',
    ring: 'ring-emerald-200/70',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    valueAccent: 'text-amber-700',
    ring: 'ring-amber-200/70',
  },
  purple: {
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-700',
    valueAccent: 'text-violet-700',
    ring: 'ring-violet-200/70',
  },
  rose: {
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-700',
    valueAccent: 'text-rose-700',
    ring: 'ring-rose-200/70',
  },
  orange: {
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-700',
    valueAccent: 'text-orange-700',
    ring: 'ring-orange-200/70',
  },
};

export default function StatGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const tone = stat.tone ?? 'neutral';
        const t = TONE_STYLES[tone];
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className={cn(
              'rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 transition-shadow hover:shadow-md',
              t.ring,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    'mt-1.5 text-2xl font-semibold tracking-tight',
                    t.valueAccent,
                  )}
                >
                  {stat.value}
                </p>
              </div>
              {Icon ? (
                <div
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                    t.iconBg,
                    t.iconText,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              ) : null}
            </div>

            {stat.helperText && (
              <div className="mt-2 text-xs leading-5 text-slate-500">{stat.helperText}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
