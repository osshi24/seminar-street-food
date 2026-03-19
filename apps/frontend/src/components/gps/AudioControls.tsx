'use client';

interface Props {
  storeName: string | null;
  onStop: () => void;
  onSkip: () => void;
}

export default function AudioControls({ storeName, onStop, onSkip }: Props) {
  if (!storeName) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
      <span className="text-xl">▶️</span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-blue-800">{storeName}</p>
        <p className="text-xs text-blue-600">Đang phát thuyết minh</p>
      </div>
      <button
        onClick={onStop}
        className="rounded-md border border-blue-300 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
        title="Dừng"
      >
        Dừng
      </button>
      <button
        onClick={onSkip}
        className="rounded-md border border-blue-300 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
        title="Bỏ qua"
      >
        Bỏ qua
      </button>
    </div>
  );
}
