export default function EmptyState() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white py-12 text-center">
      <div className="mb-3 text-4xl">🍽️</div>
      <p className="font-semibold text-gray-700">Không tìm thấy gợi ý phù hợp</p>
      <p className="mt-1 text-sm text-gray-400">Thử lại với tiêu chí khác</p>
    </div>
  );
}
