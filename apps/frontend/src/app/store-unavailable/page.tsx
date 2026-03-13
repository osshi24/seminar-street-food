import Link from 'next/link';

export default function StoreUnavailablePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-5xl">🏪</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          Gian hàng không khả dụng
        </h1>
        <p className="mb-6 text-gray-500">
          Gian hàng bạn đang tìm kiếm hiện không còn hoạt động hoặc QR code đã hết hiệu lực.
          Vui lòng liên hệ chủ gian hàng để biết thêm thông tin.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
