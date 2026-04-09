import Link from 'next/link';
import PublicHeader from '../components/layout/PublicHeader';
import { listStores } from '../lib/api/commentary';

async function getStoreCount(): Promise<number> {
  try {
    const res = await listStores({ limit: 1 });
    return (res.data as { total: number })?.total ?? 0;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const storeCount = await getStoreCount();

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-b from-orange-50 to-white py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="mb-4 text-6xl">🍜</div>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Phố Ẩm Thực</h1>
            <p className="mt-4 text-lg text-gray-600">
              Khám phá hàng trăm gian hàng ẩm thực đặc sắc. Nghe thuyết minh, xem đánh giá,
              tìm đường đi — tất cả trong một ứng dụng.
            </p>
            {storeCount > 0 && (
              <p className="mt-2 text-sm font-medium text-orange-600">
                {storeCount} gian hàng đang hoạt động
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/stores"
                className="rounded-xl bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow hover:bg-orange-600 transition-colors"
              >
                Xem gian hàng
              </Link>
              <Link
                href="/map"
                className="rounded-xl border border-gray-200 bg-white px-8 py-3 text-base font-semibold text-gray-700 shadow hover:bg-gray-50 transition-colors"
              >
                Khám phá bản đồ
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-800">Tính năng nổi bật</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">🗺️</div>
              <h3 className="mb-2 font-semibold text-gray-800">Bản đồ tương tác</h3>
              <p className="text-sm text-gray-500">
                Xem vị trí các gian hàng trên bản đồ, chọn gian hàng và tìm đường đi bộ trực tiếp.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">🔊</div>
              <h3 className="mb-2 font-semibold text-gray-800">Thuyết minh tự động</h3>
              <p className="text-sm text-gray-500">
                Tự động phát thuyết minh bằng nhiều ngôn ngữ khi bạn đến gần gian hàng.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">⭐</div>
              <h3 className="mb-2 font-semibold text-gray-800">Đánh giá thực</h3>
              <p className="text-sm text-gray-500">
                Đọc và viết đánh giá từ khách hàng đã trải nghiệm thực tế.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
