'use client';

import { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
}

export default function InfoCard({ title, icon, children }: InfoCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}
