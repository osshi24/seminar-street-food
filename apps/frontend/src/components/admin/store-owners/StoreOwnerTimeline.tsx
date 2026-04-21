'use client';

import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../../lib/cn';

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
  red: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
};

export default function StoreOwnerTimeline({ events }: StoreOwnerTimelineProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 border-b border-slate-100">
        <Calendar className="h-4 w-4 text-slate-500" />
        <CardTitle className="text-sm">Lịch sử hoạt động</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {events.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Chưa có hoạt động nào</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm',
                      COLOR_CLASSES[event.color],
                    )}
                  >
                    {event.icon}
                  </div>
                  {idx < events.length - 1 ? (
                    <div className="mt-1 h-8 w-px bg-slate-200" />
                  ) : null}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{event.label}</p>
                      {event.description ? (
                        <p className="text-xs text-slate-500">{event.description}</p>
                      ) : null}
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
