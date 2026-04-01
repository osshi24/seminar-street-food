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
    <div className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
