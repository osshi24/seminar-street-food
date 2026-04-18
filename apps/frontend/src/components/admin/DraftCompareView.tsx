'use client';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  action?: 'added' | 'modified' | 'removed';
}

interface DraftSide {
  name: string;
  description?: string | null;
  menuItems: MenuItem[];
}

interface DraftCompareViewProps {
  current: DraftSide;
  proposed: DraftSide;
}

function diffClasses(action?: string) {
  if (action === 'added') return 'border-emerald-200 bg-emerald-50';
  if (action === 'modified') return 'border-amber-200 bg-amber-50';
  if (action === 'removed') return 'border-rose-200 bg-rose-50 line-through';
  return 'border-slate-200 bg-slate-50';
}

function MenuList({ items, highlight }: { items: MenuItem[]; highlight?: boolean }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
        Chưa có món nào trong danh sách này.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className={`rounded-2xl border px-4 py-3 ${highlight ? diffClasses(item.action) : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">{item.name}</p>
              {item.action ? (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.action}
                </p>
              ) : null}
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DraftCompareView({ current, proposed }: DraftCompareViewProps) {
  const nameChanged = proposed.name !== current.name;
  const descChanged = proposed.description !== current.description;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Hiện tại</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">Nội dung đang live</h3>

        <div className="mt-6 space-y-5">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tên gian hàng</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{current.name}</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mô tả</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {current.description || 'Chưa có mô tả hiện tại.'}
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Menu hiện tại</p>
            <MenuList items={current.menuItems} />
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-cyan-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Đề xuất</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">Bản nháp chờ duyệt</h3>

        <div className="mt-6 space-y-5">
          <div className={`rounded-[24px] border p-5 ${nameChanged ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tên gian hàng</p>
            <p className={`mt-2 text-xl font-semibold ${nameChanged ? 'text-cyan-900' : 'text-slate-950'}`}>
              {proposed.name}
            </p>
          </div>

          <div className={`rounded-[24px] border p-5 ${descChanged ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mô tả</p>
            <p className={`mt-2 text-sm leading-7 ${descChanged ? 'text-cyan-900' : 'text-slate-600'}`}>
              {proposed.description || 'Bản nháp chưa có mô tả.'}
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Menu đề xuất</p>
            <MenuList items={proposed.menuItems} highlight />
          </div>
        </div>
      </section>
    </div>
  );
}
