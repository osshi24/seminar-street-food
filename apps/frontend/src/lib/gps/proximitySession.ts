export type GPSStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

export interface NearbyStore {
  storeId: string;
  storeName: string;
  distanceMeters: number;
  lat: number;
  lng: number;
}

export function createProximitySession(): Map<string, boolean> {
  return new Map<string, boolean>();
}

export function hasPlayed(session: Map<string, boolean>, storeId: string): boolean {
  return session.get(storeId) === true;
}

export function markPlayed(
  session: Map<string, boolean>,
  storeId: string,
): Map<string, boolean> {
  const next = new Map(session);
  next.set(storeId, true);
  return next;
}
