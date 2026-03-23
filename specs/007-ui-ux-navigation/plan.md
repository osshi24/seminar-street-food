# Implementation Plan: UI/UX Navigation

**Branch**: `007-ui-ux-navigation` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)

## Summary

Spec này wrap toàn bộ các trang hiện có vào layout chung cho 3 khu vực: Admin (sidebar
cố định), Store Owner Dashboard (sidebar + header), và Public (header toàn cục). Không
có backend changes — thuần frontend Next.js App Router.

Approach: Tạo `layout.tsx` tại mỗi route group (`(admin)`, `(store-owner)`, `(public)`)
để tự động wrap tất cả trang con. Next.js App Router cho phép nested layouts nên
không cần sửa từng page.

## Constitution Check

| Nguyên tắc | Trạng thái |
|---|---|
| **Approval-First** | N/A — không có content submission |
| **RBAC** | PASS — guard redirect đã có, layout chỉ wrap visual |
| **AI** | N/A |
| **GPS** | N/A |
| **Data Integrity** | N/A |
| **Mandatory API Testing** | N/A — thuần frontend, không có API endpoint mới |

## Project Structure

```text
frontend/src/
├── app/
│   ├── (admin)/
│   │   └── layout.tsx                    ← MỚI: AdminLayout wrapper
│   ├── (store-owner)/
│   │   └── layout.tsx                    ← MỚI: DashboardLayout wrapper
│   ├── (public)/
│   │   └── layout.tsx                    ← MỚI: PublicLayout wrapper
│   └── page.tsx                          ← SỬA: Trang chủ có nội dung thực
├── components/
│   ├── layout/
│   │   ├── AdminSidebar.tsx              ← MỚI
│   │   ├── AdminHeader.tsx               ← MỚI
│   │   ├── DashboardSidebar.tsx          ← MỚI
│   │   ├── DashboardHeader.tsx           ← MỚI
│   │   └── PublicHeader.tsx              ← MỚI
│   └── ui/
│       └── NavLink.tsx                   ← MỚI: Active-aware Link wrapper
└── app/
    └── (store-owner)/
        └── dashboard/
            └── reviews/
                └── page.tsx              ← MỚI: Trang bình luận Store Owner
```

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 14 App Router
**Key Pattern**: Route group `layout.tsx` — tự động apply cho tất cả trang con
**Auth**: Đọc token từ `localStorage`/`sessionStorage` (đã có) trong Client Components;
  layout dùng `'use client'` để check auth và redirect
**State**: Không có global state mới — sidebar chỉ dùng `usePathname()` để detect active

## Complexity Tracking

Không có deviation nào. Đây là standard Next.js App Router pattern.
