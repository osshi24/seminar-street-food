'use client';

interface Props {
  qrImageUrl: string | null;
  loading?: boolean;
  storeName?: string;
}

export default function QRCodeDisplay({ qrImageUrl, loading, storeName }: Props) {
  if (loading && !qrImageUrl) {
    return (
      <div className="h-48 w-48 animate-pulse rounded-lg bg-gray-100" />
    );
  }

  if (!qrImageUrl) return null;

  return (
    <div className="relative inline-block rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <img
        src={qrImageUrl}
        alt={storeName ? `QR code cho ${storeName}` : 'QR code'}
        className="h-48 w-48"
      />
      {loading && (
        <div
          className="absolute inset-0 rounded-lg bg-white/60"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
