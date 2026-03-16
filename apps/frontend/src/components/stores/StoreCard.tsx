import Link from 'next/link';
import Image from 'next/image';

interface TagItem {
  id: number;
  nameVi: string;
}

interface StoreCardProps {
  id: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  menuItemCount: number;
  hasCommentary: boolean;
  tags?: TagItem[];
  viewMode?: 'grid' | 'list';
}

export default function StoreCard({
  id,
  name,
  description,
  thumbnailUrl,
  menuItemCount,
  hasCommentary,
  tags,
  viewMode = 'grid',
}: StoreCardProps) {
  const topTags = tags?.slice(0, 3) ?? [];

  if (viewMode === 'list') {
    return (
      <Link
        href={`/stores/${id}`}
        className="flex gap-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden p-3 items-start"
      >
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
          {thumbnailUrl ? (
            <Image src={thumbnailUrl} alt={name} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-gray-400 text-xs text-center px-1">Chưa có ảnh</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{name}</h3>
            {hasCommentary && (
              <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Có thuyết minh
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{description}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">{menuItemCount} món ăn</p>
          {topTags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {topTags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
                >
                  {tag.nameVi}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/stores/${id}`}
      className="block rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gray-100">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">Chưa có ảnh</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{name}</h3>
          {hasCommentary && (
            <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              Có thuyết minh
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{description}</p>
        )}
        <p className="mt-2 text-xs text-gray-400">{menuItemCount} món ăn</p>
        {topTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {topTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
              >
                {tag.nameVi}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
