const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface PublicPin {
  id: string;
  storeId: string;
  storeName: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string | null;
  shortDescription: string | null;
  hasCommentary: boolean;
  priceRange: { min: number; max: number } | null;
}

export interface BoundaryData {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number }[];
}

export interface PublicPinsResponse {
  pins: PublicPin[];
  boundary: BoundaryData | null;
}

export interface StorePinDetail {
  id: string;
  storeId: string;
  storeName: string;
  latitude: number;
  longitude: number;
  reviewedAt: string | null;
}

export async function getPublicPins(): Promise<PublicPinsResponse> {
  const res = await fetch(`${API_URL}/map/pins`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch public pins');
  const json = await res.json() as { data: PublicPinsResponse };
  return json.data;
}

export async function getStorePinDetail(storeId: string): Promise<StorePinDetail | null> {
  const res = await fetch(`${API_URL}/map/pins/${storeId}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json() as { data: StorePinDetail | null };
  return json.data;
}
