'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { fetchReportReasons, submitReport } from '../../lib/api/reports';
import type { ReportReason } from '../../types/report';

interface ReportModalProps {
  reviewId: string;
  storeId: string;
  token: string;
  onClose: () => void;
}

export default function ReportModal({ reviewId, storeId, token, onClose }: ReportModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportReasons().then(setReasons).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Vui lòng chọn lý do báo cáo');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitReport(storeId, reviewId, { reasonId: selectedReason }, token);
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err?.status === 409 ? 'Bạn đã báo cáo bình luận này rồi.' : 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </span>
            <DialogTitle>Báo cáo bình luận</DialogTitle>
          </div>
          <DialogDescription>
            Chọn lý do bạn cho rằng bình luận này vi phạm tiêu chuẩn cộng đồng.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium text-slate-800">Báo cáo đã được gửi!</p>
            <p className="text-xs text-slate-500">Cảm ơn bạn đã giúp cộng đồng sạch hơn.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Lý do báo cáo</label>
              <div className="grid gap-2">
                {reasons.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      selectedReason === r.id
                        ? 'border-rose-400 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => { setSelectedReason(r.id); setError(null); }}
                      className="accent-rose-500"
                    />
                    {r.labelVi}
                  </label>
                ))}
              </div>
              {error && (
                <p className="text-xs text-rose-500">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" variant="destructive" disabled={loading || !selectedReason}>
                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
