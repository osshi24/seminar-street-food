'use client';

import { ReactNode } from 'react';
import { Info } from 'lucide-react';
import AdminInfoCard from '../common/AdminInfoCard';

interface InfoCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
}

export default function InfoCard({ title, children }: InfoCardProps) {
  return (
    <AdminInfoCard title={title} icon={Info}>
      {children}
    </AdminInfoCard>
  );
}
