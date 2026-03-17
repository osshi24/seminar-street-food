import { saveReturnUrl } from '../auth/customer-session';

export function redirectToGoogleOAuth(returnUrl: string): void {
  saveReturnUrl(returnUrl);
  const oauthUrl = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL ?? 'http://localhost:3001/api/auth/google';
  window.location.href = oauthUrl;
}

export interface CustomerProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export async function fetchCurrentCustomer(token: string): Promise<CustomerProfile> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const res = await fetch(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch customer profile');
  const json = await res.json() as { data: CustomerProfile } | CustomerProfile;
  // Handle both wrapped { data: ... } and unwrapped response shapes
  return 'data' in json ? json.data : json;
}
