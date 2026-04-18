'use client';

import { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
}

export default function InfoCard({ title, icon, children }: InfoCardProps) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
        {icon ? (
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-50 text-lg text-cyan-700 ring-1 ring-cyan-100">
            {icon}
          </span>
        ) : null}
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}
