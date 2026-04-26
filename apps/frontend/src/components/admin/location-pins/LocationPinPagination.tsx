'use client';

import AdminPagination from '../common/AdminPagination';

interface LocationPinPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function LocationPinPagination(props: LocationPinPaginationProps) {
  if (props.totalPages <= 1) return null;
  return <AdminPagination {...props} />;
}
