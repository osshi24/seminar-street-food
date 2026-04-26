'use client';

import AdminPagination from '../common/AdminPagination';

interface ReportPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function ReportPagination(props: ReportPaginationProps) {
  if (props.totalPages <= 1) return null;
  return <AdminPagination {...props} />;
}
