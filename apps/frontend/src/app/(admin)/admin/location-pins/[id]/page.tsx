'use client';

import { useParams } from 'next/navigation';
import LocationPinDetailClient from './LocationPinDetailClient';

export default function PinDetailPage() {
  const params = useParams<{ id: string }>();

  return <LocationPinDetailClient id={params.id} />;
}
