'use client';

import React from 'react';
import { Info } from 'lucide-react';
import AdminInfoCard from '../common/AdminInfoCard';

interface LocationPinInfoSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export default function LocationPinInfoSection({
  title,
  children,
  className = '',
}: LocationPinInfoSectionProps) {
  return (
    <div className={className}>
      <AdminInfoCard title={title} icon={Info}>
        <div className="space-y-3">{children}</div>
      </AdminInfoCard>
    </div>
  );
}
