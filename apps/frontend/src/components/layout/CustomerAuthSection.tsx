'use client';

import { useEffect, useRef, useState } from 'react';
import { getCustomerToken, clearCustomerToken, isCustomerLoggedIn } from '../../lib/auth/customer-session';
import { fetchCurrentCustomer, redirectToGoogleOAuth } from '../../lib/api/auth-google';
import type { CustomerProfile } from '../../lib/api/auth-google';

export default function CustomerAuthSection() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCustomerLoggedIn()) return;
    const token = getCustomerToken()!;
    fetchCurrentCustomer(token)
      .then(setCustomer)
      .catch(() => {
        clearCustomerToken();
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    clearCustomerToken();
    setCustomer(null);
    setDropdownOpen(false);
  };

  if (!customer) {
    return (
      <button
        onClick={() => redirectToGoogleOAuth(window.location.pathname)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Đăng nhập
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50"
      >
        {customer.avatarUrl ? (
          <img src={customer.avatarUrl} alt={customer.displayName} referrerPolicy="no-referrer" className="h-7 w-7 rounded-full" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">
            {customer.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <span className="max-w-[120px] truncate text-sm text-gray-700">{customer.displayName}</span>
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
