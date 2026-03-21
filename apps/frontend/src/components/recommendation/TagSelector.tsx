'use client';

import { useEffect, useRef, useState } from 'react';
import type { TagGroup } from '../../lib/api/tags';

const MAX_TAGS = 5;

interface Props {
  groups: TagGroup[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export default function TagSelector({ groups, selectedIds, onChange }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState<number[]>(selectedIds);

  // Sync external selectedIds → pending
  useEffect(() => {
    setPending(selectedIds);
  }, [selectedIds]);

  const toggle = (id: number) => {
    const next = pending.includes(id)
      ? pending.filter((v) => v !== id)
      : [...pending, id];

    setPending(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), 300);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Chọn sở thích</h2>
        <span className="text-xs text-gray-400">Đã chọn {pending.length}/{MAX_TAGS} nhãn</span>
      </div>

      {groups.map((group) => (
        <div key={group.groupType}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.tags.map((tag) => {
              const selected = pending.includes(tag.id);
              const disabled = !selected && pending.length >= MAX_TAGS;
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(tag.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selected
                      ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                      : disabled
                      ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {tag.nameVi}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
