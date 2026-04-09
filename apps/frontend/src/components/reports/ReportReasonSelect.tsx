'use client';

import type { ReportReason } from '../../types/report';

interface ReportReasonSelectProps {
  reasons: ReportReason[];
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function ReportReasonSelect({ reasons, value, onChange }: ReportReasonSelectProps) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className="w-full rounded border border-gray-200 p-2 text-sm focus:border-orange-400 focus:outline-none"
    >
      <option value="">-- Chọn lý do --</option>
      {reasons.map((r) => (
        <option key={r.id} value={r.id}>
          {r.labelVi}
        </option>
      ))}
    </select>
  );
}
