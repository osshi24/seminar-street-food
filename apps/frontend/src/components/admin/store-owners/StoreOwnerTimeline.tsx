'use client';

export interface TimelineEvent {
  icon: string;
  label: string;
  description?: string;
  timestamp: string;
  color: 'blue' | 'green' | 'red' | 'amber' | 'slate';
}

interface StoreOwnerTimelineProps {
  events: TimelineEvent[];
}

const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
};

export default function StoreOwnerTimeline({ events }: StoreOwnerTimelineProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-6">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <span className="text-xl">📅</span>
        Lịch sử hoạt động
      </h2>

      <div className="space-y-4">
        {events.map((event, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${COLOR_CLASSES[event.color]}`}>
                {event.icon}
              </div>
              {idx < events.length - 1 && <div className="mt-2 h-8 w-0.5 bg-gray-200" />}
            </div>

            <div className="pb-4 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{event.label}</p>
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {new Date(event.timestamp).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p>Chưa có hoạt động nào</p>
        </div>
      )}
    </div>
  );
}
