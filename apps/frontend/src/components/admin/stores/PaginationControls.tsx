'use client';

import AdminPagination from '../common/AdminPagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls(props: PaginationProps) {
  return <AdminPagination {...props} />;
}
