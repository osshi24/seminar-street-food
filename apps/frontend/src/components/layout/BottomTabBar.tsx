'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import LanguageSwitcher from './LanguageSwitcher';
import {
  getCustomerToken,
  clearCustomerToken,
  isCustomerLoggedIn,
} from '../../lib/auth/customer-session';
import { fetchCurrentCustomer, redirectToGoogleOAuth } from '../../lib/api/auth-google';
import type { CustomerProfile } from '../../lib/api/auth-google';
import type { QrResolveResult } from '../../lib/api/qr';

const QrScannerModal = dynamic(() => import('../qr/QrScannerModal'), { ssr: false });

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showAccount, setShowAccount] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    if (!isCustomerLoggedIn()) return;
    const token = getCustomerToken()!;
    fetchCurrentCustomer(token)
      .then(setCustomer)
      .catch(() => clearCustomerToken());
  }, []);

  useEffect(() => { setShowAccount(false); }, [pathname]);

  function handleLogout() {
    clearCustomerToken();
    setCustomer(null);
    setShowAccount(false);
  }

  function handleQrResult(result: QrResolveResult) {
    setShowQrScanner(false);
    if (result.type === 'store') {
      router.push(`/map?storeId=${result.storeId}`);
    } else if (result.type === 'boundary') {
      sessionStorage.setItem(
        `boundary_qr_${result.boundary.id}`,
        JSON.stringify(result.boundary),
      );
      router.push(`/map?boundaryQrId=${result.boundary.id}`);
    } else {
      setQrError('Cửa hàng hoặc khu vực không tồn tại');
      setTimeout(() => setQrError(null), 3500);
    }
  }

  return (
    <>
      {showQrScanner && (
        <QrScannerModal
          onResult={handleQrResult}
          onClose={() => setShowQrScanner(false)}
        />
      )}

      {qrError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[55] sm:hidden bg-gray-900 text-white text-sm rounded-full px-4 py-2 shadow-lg whitespace-nowrap">
          {qrError}
        </div>
      )}

      {showAccount && (
        <div
          className="fixed inset-0 z-[60] sm:hidden bg-black/20"
          onClick={() => setShowAccount(false)}
        >
          <div
            className="absolute bottom-14 left-0 right-0 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 px-4 pb-5"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-5" />
            {customer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {customer.avatarUrl ? (
                    <img src={customer.avatarUrl} alt={customer.displayName} referrerPolicy="no-referrer" className="h-12 w-12 rounded-full" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-lg font-semibold text-orange-600">
                      {customer.displayName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{customer.displayName}</p>
                    <p className="text-xs text-gray-400">Đã đăng nhập</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full rounded-xl border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">Đăng nhập để nhận ưu đãi</p>
                <button
                  onClick={() => redirectToGoogleOAuth(pathname)}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-white border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Đăng nhập bằng Google
                </button>
              </div>
            )}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-14 items-center">
          <Link
            href="/map"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname.startsWith('/map') ? 'text-orange-600' : 'text-gray-500'}`}
          >
            <MapIcon active={pathname.startsWith('/map')} />
            <span className="text-[10px] font-medium">Bản đồ</span>
          </Link>

          <Link
            href="/stores"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname.startsWith('/stores') ? 'text-orange-600' : 'text-gray-500'}`}
          >
            <StoreIcon active={pathname.startsWith('/stores')} />
            <span className="text-[10px] font-medium">Cửa hàng</span>
          </Link>

          <button
            onClick={() => setShowQrScanner(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 transition-colors"
          >
            <QrIcon />
            <span className="text-[10px] font-medium">Quét QR</span>
          </button>

          <button
            onClick={() => setShowAccount((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${showAccount ? 'text-orange-600' : 'text-gray-500'}`}
          >
            {customer?.avatarUrl ? (
              <img src={customer.avatarUrl} alt="" referrerPolicy="no-referrer" className={`h-6 w-6 rounded-full border-2 ${showAccount ? 'border-orange-600' : 'border-gray-300'}`} />
            ) : (
              <PersonIcon active={showAccount} />
            )}
            <span className="text-[10px] font-medium">Tài khoản</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function MapIcon({ active }: { active: boolean }) {
  const c = active ? '#ea580c' : '#6b7280';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function StoreIcon({ active }: { active: boolean }) {
  const c = active ? '#ea580c' : '#6b7280';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function QrIcon() {
  const c = '#6b7280';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 9 4 4 9 4" stroke={c} strokeWidth="2" />
      <polyline points="15 4 20 4 20 9" stroke={c} strokeWidth="2" />
      <polyline points="20 15 20 20 15 20" stroke={c} strokeWidth="2" />
      <polyline points="9 20 4 20 4 15" stroke={c} strokeWidth="2" />
      <rect x="7" y="7" width="3.5" height="3.5" rx="0.5" fill={c} />
      <rect x="13.5" y="7" width="3.5" height="3.5" rx="0.5" fill={c} />
      <rect x="7" y="13.5" width="3.5" height="3.5" rx="0.5" fill={c} />
      <rect x="14" y="14" width="2" height="2" rx="0.3" fill={c} />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  const c = active ? '#ea580c' : '#6b7280';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
