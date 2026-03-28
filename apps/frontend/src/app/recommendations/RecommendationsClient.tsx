'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchTags, type TagGroup } from '../../lib/api/tags';
import { fetchRecommendations, type RecommendationItem, type Pagination } from '../../lib/api/recommendations';
import TagSelector from '../../components/recommendation/TagSelector';
import RecommendationList from '../../components/recommendation/RecommendationList';

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export default function RecommendationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<TagGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    const raw = searchParams.get('tags');
    if (!raw) return [];
    return raw.split(',').map(Number).filter(Boolean);
  });
  const [page, setPage] = useState<number>(() => {
    return parseInt(searchParams.get('page') ?? '1', 10) || 1;
  });
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTags()
      .then((data) => setGroups(data.groups))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const raw = searchParams.get('tags');
    const ids = raw ? raw.split(',').map(Number).filter(Boolean) : [];
    setSelectedIds(ids);
    setPage(parseInt(searchParams.get('page') ?? '1', 10) || 1);
  }, [searchParams]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setItems([]);
      setPagination(EMPTY_PAGINATION);
      return;
    }
    setLoading(true);
    fetchRecommendations(selectedIds, page)
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
      })
      .catch(() => {
        setItems([]);
        setPagination(EMPTY_PAGINATION);
      })
      .finally(() => setLoading(false));
  }, [selectedIds, page]);

  const updateUrl = useCallback(
    (ids: number[], p: number) => {
      const params = new URLSearchParams();
      if (ids.length > 0) params.set('tags', ids.join(','));
      if (p > 1) params.set('page', String(p));
      const query = params.toString();
      router.push(`/recommendations${query ? `?${query}` : ''}`, { scroll: false });
    },
    [router],
  );

  const handleTagChange = (ids: number[]) => {
    updateUrl(ids, 1);
  };

  const handlePageChange = (p: number) => {
    updateUrl(selectedIds, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-bold text-gray-900">Gợi ý món ăn</h1>
      <p className="mb-8 text-gray-500">Chọn các nhãn sở thích để nhận gợi ý món ăn phù hợp với bạn.</p>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <TagSelector groups={groups} selectedIds={selectedIds} onChange={handleTagChange} />
        </aside>

        <section>
          {selectedIds.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white py-16 text-center">
              <div className="mb-3 text-4xl">🍜</div>
              <p className="font-semibold text-gray-700">Chọn nhãn sở thích để bắt đầu</p>
              <p className="mt-1 text-sm text-gray-400">Chọn các nhãn bên trái để nhận gợi ý món ăn phù hợp</p>
            </div>
          ) : (
            <>
              {!loading && items.length > 0 && (
                <p className="mb-3 text-sm text-gray-500">
                  {pagination.totalCount} kết quả · Trang {page}/{pagination.totalPages}
                </p>
              )}
              <RecommendationList
                items={items}
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

