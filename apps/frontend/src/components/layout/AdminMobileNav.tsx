'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChefHat, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import AdminSidebarNav from './AdminSidebarNav';

export default function AdminMobileNav() {
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
          <Link href="/admin" className="flex items-center gap-2.5 text-slate-900" onClick={() => setOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
              <ChefHat className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Phố Ẩm Thực</p>
              <p className="text-[11px] leading-tight text-slate-500">Admin Console</p>
            </div>
          </Link>
        </div>
        <div className="overflow-y-auto py-4">
          <AdminSidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
