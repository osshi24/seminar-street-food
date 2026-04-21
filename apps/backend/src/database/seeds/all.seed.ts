/**
 * Full system seed — covers spec 001, 002, 003
 * Idempotent: skips any record that already exists (checked by unique key)
 * Run: npm run seed:all -w @seminar/backend
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';

import { AdminAccount } from '../../entities/admin-account.entity';
import { StoreOwnerAccount, StoreOwnerStatus } from '../../entities/store-owner-account.entity';
import { Store, StoreStatus } from '../../stores/entities/store.entity';
import { StoreContentDraft, DraftStatus } from '../../stores/entities/store-content-draft.entity';
import { MenuItem } from '../../stores/entities/menu-item.entity';
import { StoreImage } from '../../stores/entities/store-image.entity';
import { Commentary, CommentaryPipelineStatus } from '../../commentary/entities/commentary.entity';
import { LocationPin, LocationPinStatus } from '../../location/entities/location-pin.entity';
import { FoodStreetBoundary } from '../../admin/entities/food-street-boundary.entity';
import { COMMENTARY_QUEUE } from '../../commentary/commentary.constants';
import { seedPreferenceTags } from './preference-tags.seed';
import { seedMonitoring } from './monitoring.seed';
import { SystemMetric } from '../../monitoring/entities/system-metric.entity';
import { RequestLog } from '../../monitoring/entities/request-log.entity';
import { AuditLog } from '../../monitoring/entities/audit-log.entity';

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const ADMIN = {
  email: 'admin@phoamthuc.vn',
  password: 'Admin@123456',
  fullName: 'System Admin',
};

const STORE_OWNERS = [
  {
    email: 'owner1@phoamthuc.vn',
    password: 'Owner@123456',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    registrationReason: 'Muốn giới thiệu quán cơm tấm gia truyền của gia đình',
    status: StoreOwnerStatus.ACTIVE,
  },
  {
    email: 'owner2@phoamthuc.vn',
    password: 'Owner@123456',
    fullName: 'Trần Thị Bình',
    phone: '0912345678',
    registrationReason: 'Muốn quảng bá quán bánh mì nổi tiếng',
    status: StoreOwnerStatus.ACTIVE,
  },
  {
    email: 'owner3@phoamthuc.vn',
    password: 'Owner@123456',
    fullName: 'Lê Minh Châu',
    phone: '0923456789',
    registrationReason: 'Quán phở truyền thống muốn mở rộng',
    status: StoreOwnerStatus.ACTIVE,
  },
  {
    email: 'pending@phoamthuc.vn',
    password: 'Owner@123456',
    fullName: 'Phạm Thị Dung',
    phone: '0934567890',
    registrationReason: 'Mới mở quán bún bò, muốn tham gia phố ẩm thực',
    status: StoreOwnerStatus.PENDING,
  },
  {
    email: 'rejected@phoamthuc.vn',
    password: 'Owner@123456',
    fullName: 'Võ Văn Em',
    phone: '0945678901',
    registrationReason: 'Muốn bán đồ ăn nhanh',
    status: StoreOwnerStatus.REJECTED,
  },
];

const STORES = [
  {
    ownerEmail: 'owner1@phoamthuc.vn',
    name: 'Cơm Tấm Bà Ba',
    description:
      'Quán cơm tấm gia truyền hơn 30 năm với công thức sườn nướng đặc biệt, mỡ hành thơm ngon. ' +
      'Mỗi phần cơm được phục vụ kèm chả trứng, bì và nước mắm pha chua ngọt theo bí quyết riêng của gia đình.',
    menuItems: [
      { name: 'Cơm tấm sườn bì chả', price: 45000, description: 'Cơm tấm đầy đủ topping' },
      { name: 'Cơm tấm sườn nướng', price: 40000, description: 'Sườn nướng than hoa' },
      { name: 'Cơm tấm bì chả', price: 35000, description: 'Không có sườn' },
      { name: 'Nước mía ép', price: 15000, description: 'Nước mía tươi' },
    ],
    images: [
      'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
    ],
    location: { lat: 10.762622, lng: 106.660172 },
  },
  {
    ownerEmail: 'owner2@phoamthuc.vn',
    name: 'Bánh Mì Hương Xưa',
    description:
      'Bánh mì Sài Gòn chính gốc với vỏ bánh giòn tan, nhân phong phú gồm pate thịt nguội tự làm, ' +
      'rau thơm tươi và tương ớt đặc biệt. Mở cửa từ 6h sáng, phục vụ hơn 200 ổ mỗi ngày.',
    menuItems: [
      { name: 'Bánh mì thịt nguội', price: 25000, description: 'Đặc sản của quán' },
      { name: 'Bánh mì trứng', price: 20000, description: 'Trứng ốp la' },
      { name: 'Bánh mì xíu mại', price: 22000, description: 'Xíu mại sốt cà chua' },
      { name: 'Bánh mì chả cá', price: 28000, description: 'Chả cá Đà Nẵng' },
      { name: 'Cà phê sữa đá', price: 20000, description: 'Phin truyền thống' },
    ],
    images: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    ],
    location: { lat: 10.762800, lng: 106.660500 },
  },
  {
    ownerEmail: 'owner3@phoamthuc.vn',
    name: 'Phở Gia Truyền Năm Đời',
    description:
      'Nồi nước dùng được hầm từ xương bò nguyên chất trong 12 tiếng, kết hợp với các loại gia vị ' +
      'như hồi, quế, gừng nướng theo công thức bí truyền 5 đời. Thịt bò tươi thái lát mỏng, ' +
      'bánh phở mềm dai đặc trưng của vùng Nam Định.',
    menuItems: [
      { name: 'Phở bò tái', price: 55000, description: 'Thịt bò tái chín' },
      { name: 'Phở bò chín', price: 55000, description: 'Thịt bò chín mềm' },
      { name: 'Phở bò tái chín gầu', price: 65000, description: 'Đủ các loại thịt' },
      { name: 'Phở gà', price: 50000, description: 'Gà ta thả vườn' },
      { name: 'Quẩy', price: 5000, description: 'Ăn kèm phở' },
    ],
    images: [
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
      'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=800',
    ],
    location: { lat: 10.763100, lng: 106.661000 },
  },
];

// Spec 003 — food street boundary (polygon bao quanh 3 store trên)
const BOUNDARY = {
  name: 'Ranh giới Phố Ẩm Thực SGU',
  coordinates: [
    { lat: 10.764000, lng: 106.659000 },
    { lat: 10.764000, lng: 106.662500 },
    { lat: 10.761500, lng: 106.662500 },
    { lat: 10.761500, lng: 106.659000 },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`  ${msg}`);
}

function skip(msg: string) {
  console.log(`  ⏭  ${msg} (already exists, skipping)`);
}

function ok(msg: string) {
  console.log(`  ✓  ${msg}`);
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function seedAll() {
  console.log('\n🌱 Starting full system seed...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const dataSource = app.get(DataSource);
  const adminRepo = app.get<Repository<AdminAccount>>(getRepositoryToken(AdminAccount));
  const ownerRepo = app.get<Repository<StoreOwnerAccount>>(getRepositoryToken(StoreOwnerAccount));
  const storeRepo = app.get<Repository<Store>>(getRepositoryToken(Store));
  const draftRepo = app.get<Repository<StoreContentDraft>>(getRepositoryToken(StoreContentDraft));
  const menuItemRepo = app.get<Repository<MenuItem>>(getRepositoryToken(MenuItem));
  const storeImageRepo = app.get<Repository<StoreImage>>(getRepositoryToken(StoreImage));
  const commentaryRepo = app.get<Repository<Commentary>>(getRepositoryToken(Commentary));
  const pinRepo = app.get<Repository<LocationPin>>(getRepositoryToken(LocationPin));
  const boundaryRepo = app.get<Repository<FoodStreetBoundary>>(getRepositoryToken(FoodStreetBoundary));
  const commentaryQueue = app.get<Queue>(getQueueToken(COMMENTARY_QUEUE));

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  console.log('📌 Spec 001 — Accounts');

  let admin = await adminRepo.findOne({ where: { email: ADMIN.email } });
  if (admin) {
    skip(`Admin ${ADMIN.email}`);
  } else {
    const hash = await bcrypt.hash(ADMIN.password, 12);
    admin = await adminRepo.save(adminRepo.create({ email: ADMIN.email, passwordHash: hash, fullName: ADMIN.fullName }));
    ok(`Admin created: ${ADMIN.email}`);
  }

  // ── 2. Store Owners ───────────────────────────────────────────────────────
  const ownerMap: Record<string, StoreOwnerAccount> = {};

  for (const ownerData of STORE_OWNERS) {
    let owner = await ownerRepo.findOne({ where: { email: ownerData.email } });
    if (owner) {
      skip(`Store Owner ${ownerData.email}`);
    } else {
      const hash = await bcrypt.hash(ownerData.password, 12);
      owner = await ownerRepo.save(ownerRepo.create({
        email: ownerData.email,
        passwordHash: hash,
        fullName: ownerData.fullName,
        phone: ownerData.phone,
        registrationReason: ownerData.registrationReason,
        status: ownerData.status,
      }));
      ok(`Store Owner created: ${ownerData.email} (${ownerData.status})`);
    }
    ownerMap[ownerData.email] = owner;
  }

  // ── 3. Stores + Drafts + Menu Items + Images + Commentary ─────────────────
  console.log('\n📌 Spec 002 — Store Content');

  const storeMap: Record<string, Store> = {};

  for (const storeData of STORES) {
    const owner = ownerMap[storeData.ownerEmail];

    // Store
    let store = await storeRepo.findOne({ where: { ownerId: owner.id } });
    if (store) {
      skip(`Store "${storeData.name}"`);
    } else {
      store = await storeRepo.save(storeRepo.create({
        ownerId: owner.id,
        name: storeData.name,
        description: storeData.description,
        status: StoreStatus.ACTIVE,
      }));
      ok(`Store created: ${storeData.name}`);
    }
    storeMap[storeData.ownerEmail] = store;

    // Approved draft (already reflects live content)
    const existingDraft = await draftRepo.findOne({ where: { storeId: store.id, status: DraftStatus.APPROVED } });
    if (existingDraft) {
      skip(`Approved draft for "${storeData.name}"`);
    } else {
      await draftRepo.save(draftRepo.create({
        storeId: store.id,
        name: storeData.name,
        description: storeData.description,
        status: DraftStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      }));
      ok(`Draft approved for: ${storeData.name}`);
    }

    // Menu items (live — isInDraft: false)
    const existingItems = await menuItemRepo.count({ where: { storeId: store.id, isInDraft: false } });
    if (existingItems > 0) {
      skip(`Menu items for "${storeData.name}"`);
    } else {
      for (const item of storeData.menuItems) {
        await menuItemRepo.save(menuItemRepo.create({
          storeId: store.id,
          name: item.name,
          price: item.price,
          description: item.description,
          isInDraft: false,
        }));
      }
      ok(`Menu items created for: ${storeData.name} (${storeData.menuItems.length} items)`);
    }

    // Store images (live — isInDraft: false)
    const existingImages = await storeImageRepo.count({ where: { storeId: store.id, isInDraft: false } });
    if (existingImages > 0) {
      skip(`Images for "${storeData.name}"`);
    } else {
      for (let i = 0; i < storeData.images.length; i++) {
        await storeImageRepo.save(storeImageRepo.create({
          storeId: store.id,
          url: storeData.images[i],
          s3Key: `seed/store-${store.id}-${i}.jpg`,
          orderIndex: i,
          isInDraft: false,
        }));
      }
      ok(`Images created for: ${storeData.name} (${storeData.images.length} images)`);
    }

    // Commentary — create record + enqueue pipeline
    const existingCommentary = await commentaryRepo.findOne({ where: { storeId: store.id } });
    if (existingCommentary) {
      skip(`Commentary for "${storeData.name}"`);
    } else {
      const commentary = await commentaryRepo.save(commentaryRepo.create({
        storeId: store.id,
        sourceText: storeData.description,
        pipelineStatus: CommentaryPipelineStatus.PENDING,
      }));

      // Link commentary to store
      await storeRepo.update({ id: store.id }, { activeCommentaryId: commentary.id });

      // Enqueue AI pipeline
      await commentaryQueue.add('process', { commentaryId: commentary.id, storeId: store.id });

      ok(`Commentary enqueued for: ${storeData.name} (pipeline will run when worker starts)`);
    }
  }

  // ── 4. Location pins + Boundary ───────────────────────────────────────────
  console.log('\n📌 Spec 003 — Map & Location');

  // Boundary
  const existingBoundary = await boundaryRepo.findOne({ where: { isActive: true } });
  if (existingBoundary) {
    skip('Food street boundary');
  } else {
    // Build WKT polygon
    const coordStr = BOUNDARY.coordinates.map((c) => `${c.lng} ${c.lat}`).join(', ');
    const firstCoord = `${BOUNDARY.coordinates[0].lng} ${BOUNDARY.coordinates[0].lat}`;
    const wkt = `POLYGON((${coordStr}, ${firstCoord}))`;

    const boundary = await boundaryRepo.save(boundaryRepo.create({
      name: BOUNDARY.name,
      polygonCoordinates: BOUNDARY.coordinates,
      isActive: true,
      createdBy: admin.id,
    }));

    await dataSource.query(
      `UPDATE food_street_boundaries SET polygon_geom = ST_GeomFromText($1, 4326) WHERE id = $2`,
      [wkt, boundary.id],
    );
    ok(`Boundary created: ${BOUNDARY.name} (${BOUNDARY.coordinates.length} points)`);
  }

  // Location pins — one approved per store
  for (const storeData of STORES) {
    const store = storeMap[storeData.ownerEmail];
    if (!store) continue;

    const existingPin = await pinRepo.findOne({ where: { storeId: store.id, status: LocationPinStatus.APPROVED } });
    if (existingPin) {
      skip(`Approved pin for "${storeData.name}"`);
      continue;
    }

    const pin = await pinRepo.save(pinRepo.create({
      storeId: store.id,
      latitude: storeData.location.lat,
      longitude: storeData.location.lng,
      status: LocationPinStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedBy: admin.id,
    }));
    ok(`Location pin approved for: ${storeData.name} (${pin.latitude}, ${pin.longitude})`);
  }

  // One pending pin for store 1 (to test admin review flow)
  const store1 = storeMap['owner1@phoamthuc.vn'];
  if (store1) {
    const existingPending = await pinRepo.findOne({ where: { storeId: store1.id, status: LocationPinStatus.PENDING } });
    if (existingPending) {
      skip('Pending pin for "Cơm Tấm Bà Ba"');
    } else {
      await pinRepo.save(pinRepo.create({
        storeId: store1.id,
        latitude: 10.762700,
        longitude: 106.660250,
        status: LocationPinStatus.PENDING,
      }));
      ok('Pending pin created for: Cơm Tấm Bà Ba (awaiting admin review)');
    }
  }

  // ── 5. Preference Tags ────────────────────────────────────────────────────
  console.log('\n📌 Spec 006 — Preference Tags');
  await seedPreferenceTags(dataSource);

  // ── 6. Monitoring synthetic data (24h history) ────────────────────────────
  console.log('\n📌 Monitoring — Synthetic 24h data');
  await seedMonitoring({
    metricRepo: app.get<Repository<SystemMetric>>(getRepositoryToken(SystemMetric)),
    requestRepo: app.get<Repository<RequestLog>>(getRepositoryToken(RequestLog)),
    auditRepo: app.get<Repository<AuditLog>>(getRepositoryToken(AuditLog)),
  });

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('─'.repeat(50));
  console.log('🔑 Credentials:');
  console.log(`   Admin:        ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`   Store Owner:  owner1@phoamthuc.vn / Owner@123456  (active)`);
  console.log(`   Store Owner:  owner2@phoamthuc.vn / Owner@123456  (active)`);
  console.log(`   Store Owner:  owner3@phoamthuc.vn / Owner@123456  (active)`);
  console.log(`   Store Owner:  pending@phoamthuc.vn / Owner@123456 (pending)`);
  console.log(`   Store Owner:  rejected@phoamthuc.vn / Owner@123456 (rejected)`);
  console.log('─'.repeat(50));
  console.log('⚠️  AI commentary pipeline sẽ chạy khi npm run dev khởi động worker\n');

  await app.close();
}

seedAll().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
