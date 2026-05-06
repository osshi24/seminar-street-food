'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChefHat, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import DashboardSidebarNav from './DashboardSidebarNav';

interface DashboardMobileNavProps {
  storeName?: string;
}

export default function DashboardMobileNav({ storeName }: DashboardMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Mở menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-slate-900"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-sm">
              <ChefHat className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Phố Ẩm Thực</p>
              <p className="text-[11px] leading-tight text-slate-500">
                {storeName ?? 'Chủ gian hàng'}
              </p>
            </div>
          </Link>
        </div>
        <div className="overflow-y-auto py-4">
          <DashboardSidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
