'use client';

import { Info } from 'lucide-react';
import AdminInfoCard from '../common/AdminInfoCard';

interface StoreOwnerInfoSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export default function StoreOwnerInfoSection({ title, children }: StoreOwnerInfoSectionProps) {
  return (
    <AdminInfoCard title={title} icon={Info}>
      {children}
    </AdminInfoCard>
  );
}
