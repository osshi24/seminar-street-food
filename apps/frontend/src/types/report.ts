export interface ReportReason {
  id: number;
  labelVi: string;
  labelEn: string;
}

export interface CommentReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reasonId: number;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface CreateReportDto {
  reasonId: number;
}
