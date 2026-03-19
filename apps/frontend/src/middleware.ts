import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/(store-owner)')) {
    const storeOwnerToken = request.cookies.get('access_token')?.value;
    if (!storeOwnerToken) {
      return NextResponse.redirect(new URL('/store-owner/login', request.url));
    }
  }

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = request.cookies.get('admin_access_token')?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (pathname === '/store-owner/login') {
    const storeOwnerToken = request.cookies.get('access_token')?.value;
    if (storeOwnerToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (pathname === '/admin/login') {
    const adminToken = request.cookies.get('admin_access_token')?.value;
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin/store-owners', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/store-owner/login'],
};
