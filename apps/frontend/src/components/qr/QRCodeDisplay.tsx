'use client';

interface Props {
  qrImageUrl: string | null;
  loading?: boolean;
  storeName?: string;
}

export default function QRCodeDisplay({ qrImageUrl, loading, storeName }: Props) {
  if (loading) {
    return (
      <div className="h-48 w-48 animate-pulse rounded-lg bg-gray-100" />
    );
  }

  if (!qrImageUrl) return null;

  return (
    <div className="inline-block rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <img
        src={qrImageUrl}
        alt={storeName ? `QR code cho ${storeName}` : 'QR code'}
        className="h-48 w-48"
      />
    </div>
  );
}
