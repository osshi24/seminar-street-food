'use client';

interface StoreOwnerInfoSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export default function StoreOwnerInfoSection({
  title,
  icon = '📋',
  children,
}: StoreOwnerInfoSectionProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <span className="text-xl">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}
