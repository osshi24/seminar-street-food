'use client';

interface Props {
  visible: boolean;
  storeName: string | null;
  onPlay: () => void;
}

export default function AutoplayBanner({ visible, storeName, onPlay }: Props) {
  if (!visible) return null;

  return (
    <button
      onClick={onPlay}
      className="flex w-full items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-left text-sm text-orange-800 hover:bg-orange-100 transition-colors"
    >
      <span className="text-xl">🔊</span>
      <div>
        <p className="font-medium">Nhấn để nghe thuyết minh</p>
        {storeName && (
          <p className="text-xs text-orange-600">{storeName}</p>
        )}
      </div>
    </button>
  );
}
