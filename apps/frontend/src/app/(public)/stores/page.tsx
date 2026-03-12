'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Suspense } from 'react';
import StoreCard from '../../../components/stores/StoreCard';
import StoreSearchBar from '../../../components/stores/StoreSearchBar';
import TagSelector from '../../../components/recommendation/TagSelector';
import { listStores } from '../../../lib/api/commentary';
import { fetchTags } from '../../../lib/api/tags';
import { fetchRecommendations } from '../../../lib/api/recommendations';
import type { TagGroup } from '../../../lib/api/tags';

interface StoreItem {
  id: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  menuItemCount: number;
  hasCommentary: boolean;
  tags?: { id: number; nameVi: string }[];
}

function StoresContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const tagsParam = searchParams.get('tags');
  const viewParam = (searchParams.get('view') as 'grid' | 'list') ?? 'grid';

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    tagsParam ? tagsParam.split(',').map(Number).filter(Boolean) : [],
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(viewParam);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load tags once
  useEffect(() => {
    fetchTags()
      .then((d) => setTagGroups(d.groups))
      .catch(() => {});
  }, []);

  // Fetch stores / recommendations when filters change
  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedTagIds.length > 0) {
        const res = await fetchRecommendations(selectedTagIds, 1);
        // Group recommendation items by storeId → unique stores
        const storeMap = new Map<string, StoreItem>();
        for (const item of res.items) {
          if (!storeMap.has(item.storeId)) {
            storeMap.set(item.storeId, {
              id: item.storeId,
              name: item.storeName,
              menuItemCount: 0,
              hasCommentary: false,
            });
          }
        }
        const storeList = Array.from(storeMap.values());
        setStores(storeList);
        setTotal(storeList.length);
      } else {
        const res = await listStores({ q, page, limit: 20 });
        const data = res.data as { data: StoreItem[]; total: number };
        setStores(data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setStores([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedTagIds, q, page]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Sync state → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (page > 1) params.set('page', String(page));
    if (selectedTagIds.length > 0) params.set('tags', selectedTagIds.join(','));
    if (viewMode !== 'grid') params.set('view', viewMode);
    const qs = params.toString();
    router.replace(qs ? `/stores?${qs}` : '/stores', { scroll: false });
  }, [selectedTagIds, viewMode, q, page, router]);

  function clearFilters() {
    setSelectedTagIds([]);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('stores.title')}</h1>
        <p className="text-gray-600 mb-6">{t('stores.subtitle')}</p>

        {/* Search */}
        <div className="mb-4 max-w-md">
          <StoreSearchBar />
        </div>

        {/* Tag filter */}
        {tagGroups.length > 0 && (
          <div className="mb-6 bg-white rounded-xl border p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-3">{t('stores.filterLabel')}</p>
            <TagSelector
              groups={tagGroups}
              selectedIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          </div>
        )}

        {/* Header row: count + view toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? t('stores.loading') : t('stores.count', { count: total })}
            {selectedTagIds.length > 0 && (
              <button
                onClick={clearFilters}
                className="ml-2 text-orange-600 underline text-sm hover:no-underline"
              >
                {t('stores.clearFilter')}
              </button>
            )}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              aria-label={t('stores.viewGrid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label={t('stores.viewList')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`bg-white rounded-lg border animate-pulse ${viewMode === 'list' ? 'h-24' : 'h-52'}`} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && stores.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-2">
              {selectedTagIds.length > 0
                ? t('stores.emptyWithFilter')
                : t('stores.emptyNoFilter')}
            </p>
            {selectedTagIds.length > 0 && (
              <button
                onClick={clearFilters}
                className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600"
              >
                {t('stores.clearFilter')}
              </button>
            )}
          </div>
        )}

        {/* Store list */}
        {!loading && stores.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
            {stores.map((store) => (
              <StoreCard key={store.id} {...store} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function StoresPage() {
  return (
    <Suspense>
      <StoresContent />
    </Suspense>
  );
}
