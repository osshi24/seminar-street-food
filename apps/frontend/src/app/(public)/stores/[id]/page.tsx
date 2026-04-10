import { cookies } from 'next/headers';
import { getStoreDetail } from '../../../../lib/api/commentary';
import StoreDetailView from '../../../../components/stores/StoreDetailView';
import ReviewList from '../../../../components/reviews/ReviewList';
import ReviewForm from '../../../../components/reviews/ReviewForm';

interface StoreDetailPageProps {
  params: { id: string };
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const cookieStore = cookies();
  const lang = cookieStore.get('phat_lang')?.value || 'vi';

  let store: {
    data: {
      id: string;
      name: string;
      description?: string | null;
      status: string;
      activeCommentaryId?: string | null;
      pipelineStatus?: string | null;
      menuItems: Array<{ id: string; name: string; description?: string | null; price: number; tags?: { id: number; nameVi: string }[] }>;
      images: Array<{ id: string; url: string; orderIndex: number }>;
    };
  } | null = null;

  try {
    store = await getStoreDetail(params.id, lang);
  } catch {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Gian hàng không tồn tại hoặc đã ngưng hoạt động</p>
      </main>
    );
  }

  if (!store) return null;
  const s = store.data;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        <StoreDetailView
          storeId={s.id}
          name={s.name}
          description={s.description}
          menuItems={s.menuItems}
          images={s.images}
          hasCommentary={!!s.activeCommentaryId}
        />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Đánh giá</h2>
          <ReviewForm storeId={s.id} />
          <ReviewList storeId={s.id} />
        </section>
      </div>
    </main>
  );
}
