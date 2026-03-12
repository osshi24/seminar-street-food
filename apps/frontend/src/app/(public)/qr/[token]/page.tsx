import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface QrResolveResponse {
  data?: { storeId?: string };
}

export default async function QrTokenPage({
  params,
}: {
  params: { token: string };
}) {
  try {
    const res = await fetch(`${API_URL}/qr/${params.token}`, {
      redirect: 'manual',
      cache: 'no-store',
    });

    // If backend redirected, follow the location
    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get('location');
      if (location) {
        redirect(location);
      }
    }
  } catch {
    // fall through to unavailable
  }

  redirect('/store-unavailable');
}
