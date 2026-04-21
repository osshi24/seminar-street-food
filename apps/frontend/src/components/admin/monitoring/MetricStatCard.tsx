'use client';

import type { ReactNode } from 'react';
import Sparkline from './Sparkline';

interface MetricStatCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: number[];
  trendColor?: string;
  trendFill?: string;
  icon?: ReactNode;
  tone?: 'default' | 'danger' | 'success' | 'warning';
}

const TONE_BG: Record<NonNullable<MetricStatCardProps['tone']>, string> = {
  default: 'bg-white',
  danger: 'bg-rose-50/40',
  success: 'bg-emerald-50/40',
  warning: 'bg-amber-50/40',
};

export default function MetricStatCard({
  label,
  value,
  hint,
  trend,
  trendColor,
  trendFill,
  icon,
  tone = 'default',
}: MetricStatCardProps) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-slate-200 ${TONE_BG[tone]} p-4`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
      {trend && trend.length > 0 ? (
        <div className="-mx-2 mt-1">
          <Sparkline values={trend} color={trendColor} fill={trendFill} height={36} />
        </div>
      ) : null}
    </div>
  );
}
