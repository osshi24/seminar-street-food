'use client';

import type { ReactNode } from 'react';

type StatTone = 'neutral' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';

export interface StatItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  helperText?: ReactNode;
  tone?: StatTone;
}

const TONE_STYLES: Record<
  StatTone,
  { cardBg: string; border: string; labelText: string; valueText: string; iconBg: string }
> = {
  neutral: {
    cardBg: 'bg-white',
    border: 'border-gray-200',
    labelText: 'text-gray-600',
    valueText: 'text-gray-900',
    iconBg: 'bg-gray-100 text-gray-700',
  },
  blue: {
    cardBg: 'bg-blue-50',
    border: 'border-blue-100',
    labelText: 'text-blue-700',
    valueText: 'text-blue-900',
    iconBg: 'bg-blue-100 text-blue-800',
  },
  emerald: {
    cardBg: 'bg-emerald-50',
    border: 'border-emerald-100',
    labelText: 'text-emerald-700',
    valueText: 'text-emerald-900',
    iconBg: 'bg-emerald-100 text-emerald-800',
  },
  amber: {
    cardBg: 'bg-amber-50',
    border: 'border-amber-100',
    labelText: 'text-amber-700',
    valueText: 'text-amber-900',
    iconBg: 'bg-amber-100 text-amber-800',
  },
  purple: {
    cardBg: 'bg-purple-50',
    border: 'border-purple-100',
    labelText: 'text-purple-700',
    valueText: 'text-purple-900',
    iconBg: 'bg-purple-100 text-purple-800',
  },
  rose: {
    cardBg: 'bg-rose-50',
    border: 'border-rose-100',
    labelText: 'text-rose-700',
    valueText: 'text-rose-900',
    iconBg: 'bg-rose-100 text-rose-800',
  },
};

export default function StatGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const tone = stat.tone ?? 'neutral';
        const s = TONE_STYLES[tone];

        return (
          <div
            key={stat.label}
            className={`rounded-xl border p-4 shadow-sm ${s.cardBg} ${s.border}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className={`text-sm font-medium ${s.labelText}`}>{stat.label}</div>
                <div className={`mt-1 text-2xl font-bold leading-none ${s.valueText}`}>
                  {stat.value}
                </div>
              </div>
              {stat.icon && (
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.iconBg}`}>
                  <span className="text-lg leading-none">{stat.icon}</span>
                </div>
              )}
            </div>

            {stat.helperText && (
              <div className="mt-3 text-xs text-gray-500">{stat.helperText}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

