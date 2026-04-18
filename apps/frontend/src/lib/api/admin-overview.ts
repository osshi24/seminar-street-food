import apiClient from './client';

export interface AdminOverviewResponse {
  metrics: {
    stores: {
      total: number;
      active: number;
      inactive: number;
    };
    storeOwners: {
      total: number;
      pending: number;
      active: number;
      inactive: number;
      rejected: number;
    };
    drafts: {
      pending: number;
    };
    locationPins: {
      pending: number;
      approved: number;
    };
    reports: {
      total: number;
      pending: number;
      resolved: number;
    };
    reviews: {
      total: number;
      hidden: number;
      visible: number;
    };
    tags: {
      total: number;
    };
    announcements: {
      draft: number;
      sent: number;
    };
  };
  recentDrafts: Array<{
    id: string;
    submittedAt: string;
    proposedName: string;
    store: { id: string; name: string } | null;
  }>;
  recentReports: Array<{
    id: string;
    createdAt: string;
    reason: { id: number; labelVi: string } | null;
    reporter: { id: string; fullName: string } | null;
    review: {
      id: string;
      content: string | null;
      stars: number;
      customerName: string | null;
      storeName: string | null;
    } | null;
  }>;
  recentReviews: Array<{
    id: string;
    createdAt: string;
    stars: number;
    content: string | null;
    isHidden: boolean;
    reportCount: number;
    customer: { displayName: string; avatarUrl: string | null } | null;
    store: { id: string; name: string } | null;
  }>;
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const response = await apiClient.get<{ data: AdminOverviewResponse }>('/admin/overview');
  return response.data.data;
}
