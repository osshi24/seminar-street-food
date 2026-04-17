'use client';

import { useState, useRef, useEffect } from 'react';

interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  icon?: string;
}

interface ActionsMenuProps {
  items: ActionMenuItem[];
}

export default function ActionsMenu({ items }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200"
        title="Thêm tùy chọn"
      >
        <span className="text-lg">⋯</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm font-medium transition-colors first:rounded-t-lg last:rounded-b-lg ${
                item.variant === 'danger'
                  ? 'text-red-700 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
