'use client';

import React from 'react';

interface LocationPinInfoSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export default function LocationPinInfoSection({
  title,
  icon,
  children,
  className = '',
}: LocationPinInfoSectionProps) {
  return (
    <div className={`rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        {icon ? (
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-xl">
            {icon}
          </span>
        ) : null}
        <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
