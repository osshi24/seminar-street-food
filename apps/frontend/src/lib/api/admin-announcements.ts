import apiClient from './client';

export type RecipientMode = 'single_store' | 'multi_store' | 'all_stores';
export type AnnouncementStatus = 'draft' | 'sent';

export type CreateAnnouncementAction = 'save_draft' | 'send';

export interface Announcement {
  id: string;
  adminId: string;
  title: string;
  body: string;
  recipientMode: RecipientMode;
  storeIds: string[] | null;
  status: AnnouncementStatus;
  recipientCount: number;
  failedEmailDetails: Array<{ email: string; error: string }> | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
}

export async function createAnnouncement(payload: {
  title: string;
  body: string;
  recipientMode: RecipientMode;
  storeIds?: string[];
  action: CreateAnnouncementAction;
}): Promise<{ data: Announcement }> {
  const res = await apiClient.post('/admin/announcements', payload);
  return res.data;
}

export async function updateAnnouncementDraft(
  id: string,
  payload: Partial<{
    title: string;
    body: string;
    recipientMode: RecipientMode;
    storeIds: string[];
  }>,
): Promise<{ data: Announcement }> {
  const res = await apiClient.patch(`/admin/announcements/${id}`, payload);
  return res.data;
}

export async function sendAnnouncement(id: string): Promise<{ data: Announcement }> {
  const res = await apiClient.post(`/admin/announcements/${id}/send`);
  return res.data;
}

export async function listAnnouncements(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  data: { items: Announcement[]; total: number; page: number; limit: number };
}> {
  const res = await apiClient.get('/admin/announcements', { params });
  return res.data;
}

