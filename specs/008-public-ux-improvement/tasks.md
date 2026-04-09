# Tasks: Public UX Improvement & Dashboard Separation

**Spec**: 008-public-ux-improvement | **Date**: 2026-04-08
**Branch**: `008-public-ux-improvement`
**Depends on**: spec 002 (stores, commentary), spec 003 (map, pins), spec 005 (GPS), spec 006 (tags, recommendations)

---

## Legend

- `[P]` — Task có thể chạy song song với các task khác trong cùng phase
- `[US1]` — Bản đồ interactive (bottom-sheet + chỉ đường + animation ghim)
- `[US2]` — Danh sách gian hàng (tag filter + grid/list toggle)
- `[US3]` — Trang chủ (store count thực)
- `[US4]` — Dashboard separation (Admin vs Store Owner visual identity)

---

## Phase 1: Setup

> Không cần setup mới — project structure đã có sẵn từ các spec trước.

---

## Phase 2: Foundation — Backend Extension

> Extend `/api/public/pins` response để bottom-sheet có đủ data. Phải hoàn thành trước Phase 3 (US1).

- [X] T001 Tìm LocationPin controller tại `apps/backend/src/` (likely `location-pins` hoặc `map` module) — xác định endpoint `GET /api/public/pins`
- [X] T002 Extend response của `GET /api/public/pins`: thêm `thumbnailUrl: string | null`, `shortDescription: string | null`, `hasCommentary: boolean`, `priceRange: { min: number; max: number } | null` vào từng pin item bằng cách JOIN với `stores` và `menu_items` tables

**Checkpoint**: `/api/public/pins` trả về đủ data cho bottom-sheet.

---

## Phase 3 — User Story 1: Bản đồ interactive [US1]

> Google Maps-style: click ghim → bottom-sheet → chỉ đường / nghe thuyết minh

### Backend (extend API type)

- [X] T003 [US1] Cập nhật type `PublicPin` tại `apps/frontend/src/lib/api/map.ts` — thêm `thumbnailUrl`, `shortDescription`, `hasCommentary`, `priceRange` vào interface

### Frontend — Component mới

- [X] T004 [US1] Tạo `StoreBottomSheet` component tại `apps/frontend/src/app/(public)/map/components/StoreBottomSheet.tsx`:
  - Props: `pin: PublicPin | null`, `onClose: () => void`
  - Khi `pin === null`: render nothing
  - Layout: fixed bottom-0 left-0 right-0 z-[1000], background trắng, rounded-t-2xl, shadow-xl
  - Nội dung: ảnh thumbnail (nếu có), tên gian hàng, mô tả ngắn (2 dòng), price range (format VND), nút "Chỉ đường" (opens Google Maps URL), nút "Nghe thuyết minh" (chỉ hiện nếu `hasCommentary`), link "Xem chi tiết →" đến `/stores/:storeId`
  - Animation: `translate-y-full` → `translate-y-0` transition khi mở
  - Nút X để đóng; click backdrop để đóng

### Frontend — Map page refactor

- [X] T005 [US1] Refactor `apps/frontend/src/app/(public)/map/page.tsx`:
  - Chuyển layout sang full-screen: bỏ `max-w-6xl` container, bỏ `py-8` padding top
  - Đưa `GpsAutoPlayController` ra ngoài map area (fixed bottom bar hoặc overlay)
  - Pass `onPinSelect` callback prop vào `MapView`
  - Render `StoreBottomSheet` với `selectedPin` state (bên ngoài MapView DOM)

- [X] T006 [US1] Refactor `apps/frontend/src/app/(public)/map/components/MapView.tsx`:
  - Thêm prop `onPinSelect: (pin: PublicPin) => void`
  - Bỏ `marker.bindPopup(...)` (HTML string popup cũ)
  - Thay bằng `marker.on('click', () => onPinSelect(pin))` cho mỗi marker
  - Thêm `useEffect` watch `nearestStoreId` từ `useProximityDetection` hook: khi thay đổi, swap icon của marker đó sang divIcon với CSS animation `pulse-ring`; reset icon cũ về default
  - Thêm nút "Định vị tôi" (Leaflet control hoặc div overlay) gọi `map.flyTo(userLocation, 17)`

---

## Phase 4 — User Story 2: Danh sách gian hàng với tag filter [US2]

> Trang `/stores`: tag filter + grid/list toggle + cải thiện StoreCard

- [X] T007 [P] [US2] Cập nhật `apps/frontend/src/components/stores/StoreCard.tsx`:
  - Thêm prop `tags?: { id: number; nameVi: string }[]`
  - Hiển thị tối đa 3 tag đầu tiên bên dưới tên gian hàng (chip style `bg-orange-50 text-orange-600 text-xs rounded-full px-2 py-0.5`)
  - Thêm prop `viewMode: 'grid' | 'list'` để switch layout:
    - `grid`: layout hiện tại (card dọc, ảnh trên)
    - `list`: layout ngang — ảnh vuông bên trái (w-24 h-24), info bên phải

- [X] T008 [US2] Refactor `apps/frontend/src/app/(public)/stores/page.tsx` thành Client Component:
  - Thêm state `selectedTagIds: number[]`, `viewMode: 'grid' | 'list'`
  - Sync `?tags=1,2,3&view=grid` vào URL (dùng `useSearchParams` + `router.replace`)
  - Render `TagSelector` (từ `apps/frontend/src/components/recommendation/TagSelector.tsx`) bên trên danh sách
  - Render 2 icon buttons để toggle grid/list layout
  - Logic fetch: nếu `selectedTagIds.length > 0` → fetch `/api/recommendations?tags=...&page=1` rồi group by `storeId` để lấy danh sách gian hàng unique; nếu `selectedTagIds.length === 0` → fetch `/api/stores` như cũ
  - Fetch tags từ `fetchTags()` để truyền vào `TagSelector`
  - Empty state khi filter không có kết quả: "Không tìm thấy gian hàng phù hợp. Thử bỏ bớt bộ lọc?" + nút "Xóa bộ lọc"

---

## Phase 5 — User Story 3: Trang chi tiết nổi bật commentary + Trang chủ [US3]

### Trang chi tiết

- [X] T009 [P] [US3] Refactor `apps/frontend/src/components/stores/StoreDetailView.tsx`:
  - Di chuyển `<CommentaryPlayer />` block lên ngay sau image carousel (trước description)
  - Wrap `CommentaryPlayer` trong styled container: `bg-orange-50 rounded-xl p-4 flex items-center gap-3` với icon loa lớn và text "Nghe thuyết minh về gian hàng này"
  - Đảm bảo on mobile 375px, CommentaryPlayer visible without scroll (above the fold)
  - Thêm link "Xem trên bản đồ →" dưới địa chỉ → navigate đến `/map?storeId={id}` (URL param để bản đồ tự mở panel đúng gian hàng)

### Trang chủ

- [X] T010 [P] [US3] Cập nhật `apps/frontend/src/app/page.tsx`:
  - Fetch số lượng gian hàng thực: `const res = await listStores({ limit: 1 }); const count = res.data.total`
  - Thêm counter vào hero section: `{count} gian hàng đang hoạt động`
  - Wrap fetch trong try/catch; nếu fail thì không hiển thị counter (không break page)

### Bản đồ — mở panel từ URL param

- [X] T011 [US3] Extend `apps/frontend/src/app/(public)/map/page.tsx`:
  - Đọc query param `?storeId=xxx` từ `searchParams`
  - Nếu có `storeId`, sau khi MapView mount, tự động set `selectedPin` = pin có `storeId` đó
  - Map flyTo về tọa độ của pin đó

---

## Phase 6 — User Story 4: Dashboard Separation [US4]

> Admin vs Store Owner: visual identity hoàn toàn khác nhau

- [X] T012 [P] [US4] Refactor `apps/frontend/src/components/layout/AdminSidebar.tsx`:
  - Đổi sidebar background: `bg-slate-900` (dark theme)
  - Đổi text: `text-slate-300` thường, `text-white font-medium` khi active
  - Active item: `bg-slate-700 text-white`
  - Hover: `hover:bg-slate-800 hover:text-white`
  - Logo section: `bg-slate-950`, text "⚙️ Admin Panel" màu trắng, badge `bg-red-600 text-white text-xs px-1.5 py-0.5 rounded ml-2`
  - Đổi toàn bộ label sang tiếng Việt:
    - "Store Owners" → "Chủ gian hàng"
    - "Store Drafts" → "Bản nháp chờ duyệt"
    - "Location Pins" → "Ghim bản đồ"
    - "Ranh giới" → giữ nguyên
    - "Báo cáo" → giữ nguyên
    - "Nhãn món ăn" → giữ nguyên
    - "Bình luận" → giữ nguyên

- [X] T013 [P] [US4] Refactor `apps/frontend/src/components/layout/AdminHeader.tsx`:
  - Thêm breadcrumb/title "Admin Panel" ở phần bên trái header
  - Đổi background header: `bg-slate-800 border-slate-700`
  - Text: màu trắng

- [X] T014 [P] [US4] Refactor `apps/frontend/src/components/layout/DashboardSidebar.tsx`:
  - Đổi sidebar background: `bg-blue-700`
  - Active item: `bg-blue-900 text-white font-medium`
  - Hover: `hover:bg-blue-800 hover:text-white`
  - Logo section: background `bg-blue-800`, text "🍜 Dashboard Gian Hàng" màu trắng
  - Store name hiển thị bên dưới logo: `text-blue-200 text-xs truncate`
  - Nav item text mặc định: `text-blue-100`, active: `text-white`

- [X] T015 [P] [US4] Refactor `apps/frontend/src/components/layout/DashboardHeader.tsx`:
  - Thêm text "Gian Hàng" ở header để phân biệt rõ với Admin
  - Đổi background: `bg-blue-700 border-blue-600`
  - Text: màu trắng

---

## Phase 7 — Polish

- [X] T016 [P] Mobile responsive kiểm tra `StoreBottomSheet` — đảm bảo panel không che khuất quá 60% chiều cao màn hình trên các device nhỏ (375px); thêm `max-h-[60vh] overflow-y-auto` cho content area bên trong sheet
- [X] T017 [P] Thêm skeleton loading cho trang `/stores` khi đang fetch với tag filter — hiển thị 6 skeleton cards thay vì màn hình trắng
- [X] T018 [P] Kiểm tra accessibility: các nút "Chỉ đường", "Nghe thuyết minh" phải có `aria-label` rõ ràng; `StoreBottomSheet` phải có `role="dialog"` và `aria-modal="true"`; phím Escape đóng sheet
- [X] T019 [P] Thêm `rel="noopener noreferrer"` cho tất cả `target="_blank"` links (Google Maps URL trong StoreBottomSheet và StoreDetailView)

---

## Dependency Graph

```
T001 → T002 → T003 → T004, T005, T006
T007, T008 (US2, independent)
T009, T010, T011 (US3, T011 depends on T005)
T012, T013, T014, T015 (US4, all parallel)
All → T016, T017, T018, T019
```

---

## Task Count Summary

| Phase | Tasks | Notes |
| ----- | ----- | ----- |
| Phase 2 — Foundation | T001–T002 | Sequential, backend extension |
| Phase 3 — US1 Map | T003–T006 | T004–T006 sau T003 |
| Phase 4 — US2 Stores list | T007–T008 | T007 parallel với T008 |
| Phase 5 — US3 Detail + Home | T009–T011 | T009, T010 parallel; T011 sau T005 |
| Phase 6 — US4 Dashboard | T012–T015 | Tất cả parallel |
| Phase 7 — Polish | T016–T019 | Tất cả parallel |
| **Total** | **19 tasks** | |
