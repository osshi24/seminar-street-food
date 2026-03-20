export interface ReviewCustomer {
  displayName: string;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  stars: number;
  content: string | null;
  createdAt: string;
  customer: ReviewCustomer;
}

export interface ReviewSummary {
  avgRating: number;
  reviewCount: number;
}

export interface ReviewMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewListResponse {
  data: Review[];
  meta: ReviewMeta;
  summary: ReviewSummary;
}
