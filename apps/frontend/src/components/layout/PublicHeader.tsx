'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import CustomerAuthSection from './CustomerAuthSection';
import LanguageSwitcher from './LanguageSwitcher';

export default function PublicHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🍜</span>
          <span className="font-bold text-gray-900">Phố Ẩm Thực</span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/stores"
            className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
          >
            {t('nav.stores')}
          </Link>
          <Link
            href="/map"
            className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
          >
            {t('nav.map')}
          </Link>
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <CustomerAuthSection />
        </div>
      </div>
    </header>
  );
}
