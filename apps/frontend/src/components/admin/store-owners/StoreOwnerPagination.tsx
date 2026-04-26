'use client';

import AdminPagination from '../common/AdminPagination';

interface StoreOwnerPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function StoreOwnerPagination(props: StoreOwnerPaginationProps) {
  if (props.totalPages <= 1) return null;
  return <AdminPagination {...props} />;
}
