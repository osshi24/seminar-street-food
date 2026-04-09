export type StoreStatus = 'active' | 'inactive';
export type DraftStatus = 'pending' | 'approved' | 'rejected';

export interface StoreDto {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  status: StoreStatus;
  activeCommentaryId?: string | null;
  hasPendingDraft?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreContentDraftDto {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  status: DraftStatus;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface MenuItemDto {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  price: number;
  isInDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreImageDto {
  id: string;
  storeId: string;
  url: string;
  s3Key: string;
  orderIndex: number;
  isInDraft: boolean;
  createdAt: string;
}
