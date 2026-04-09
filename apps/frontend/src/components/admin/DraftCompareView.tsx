'use client';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  action?: 'added' | 'modified' | 'removed';
}

interface DraftSide {
  name: string;
  description?: string | null;
  menuItems: MenuItem[];
}

interface DraftCompareViewProps {
  current: DraftSide;
  proposed: DraftSide;
}

function diffColor(action?: string) {
  if (action === 'added') return 'bg-green-50 border-l-4 border-green-400';
  if (action === 'modified') return 'bg-yellow-50 border-l-4 border-yellow-400';
  if (action === 'removed') return 'bg-red-50 border-l-4 border-red-400 line-through';
  return '';
}

export default function DraftCompareView({ current, proposed }: DraftCompareViewProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Current */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Hiện tại</h3>
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <p className="font-semibold">{current.name}</p>
          {current.description && <p className="text-sm text-gray-600">{current.description}</p>}
          {current.menuItems.length > 0 && (
            <ul className="mt-2 space-y-1">
              {current.menuItems.map((item) => (
                <li key={item.id} className="text-sm text-gray-700 flex justify-between">
                  <span>{item.name}</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Proposed */}
      <div>
        <h3 className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wide">Đề xuất</h3>
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <p className={`font-semibold ${proposed.name !== current.name ? 'text-blue-700' : ''}`}>
            {proposed.name}
          </p>
          {proposed.description && (
            <p className={`text-sm ${proposed.description !== current.description ? 'text-blue-700' : 'text-gray-600'}`}>
              {proposed.description}
            </p>
          )}
          {proposed.menuItems.length > 0 && (
            <ul className="mt-2 space-y-1">
              {proposed.menuItems.map((item) => (
                <li key={item.id} className={`text-sm flex justify-between p-1 ${diffColor(item.action)}`}>
                  <span>{item.name}</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
