'use client';

import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import AdminEmptyState from '../common/AdminEmptyState';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState(props: EmptyStateProps) {
  return <AdminEmptyState {...props} />;
}
