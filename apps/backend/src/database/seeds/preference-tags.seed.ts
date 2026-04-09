import { DataSource } from 'typeorm';

const SEED_TAGS = [
  // dish_type
  { nameVi: 'Cơm', nameEn: 'Rice', groupType: 'dish_type' },
  { nameVi: 'Phở', nameEn: 'Pho', groupType: 'dish_type' },
  { nameVi: 'Bánh mì', nameEn: 'Banh Mi', groupType: 'dish_type' },
  { nameVi: 'Lẩu', nameEn: 'Hot Pot', groupType: 'dish_type' },
  { nameVi: 'Bún', nameEn: 'Vermicelli', groupType: 'dish_type' },
  { nameVi: 'Hủ tiếu', nameEn: 'Hu Tieu', groupType: 'dish_type' },
  // flavor
  { nameVi: 'Cay', nameEn: 'Spicy', groupType: 'flavor' },
  { nameVi: 'Ngọt', nameEn: 'Sweet', groupType: 'flavor' },
  { nameVi: 'Chay', nameEn: 'Vegetarian', groupType: 'flavor' },
  { nameVi: 'Mặn', nameEn: 'Savory', groupType: 'flavor' },
  { nameVi: 'Ít dầu mỡ', nameEn: 'Low-fat', groupType: 'flavor' },
  // allergen
  { nameVi: 'Không gluten', nameEn: 'Gluten-free', groupType: 'allergen' },
  { nameVi: 'Không hải sản', nameEn: 'No seafood', groupType: 'allergen' },
  { nameVi: 'Không đậu phộng', nameEn: 'No peanuts', groupType: 'allergen' },
  { nameVi: 'Không sữa', nameEn: 'Dairy-free', groupType: 'allergen' },
];

export async function seedPreferenceTags(dataSource: DataSource): Promise<void> {
  for (const tag of SEED_TAGS) {
    const existing = await dataSource.query(
      `SELECT id FROM preference_tags WHERE name_vi = $1`,
      [tag.nameVi],
    );
    if (existing.length === 0) {
      await dataSource.query(
        `INSERT INTO preference_tags (name_vi, name_en, group_type) VALUES ($1, $2, $3)`,
        [tag.nameVi, tag.nameEn, tag.groupType],
      );
      console.log(`  ✓ Tag: ${tag.nameVi} (${tag.groupType})`);
    } else {
      console.log(`  ~ Skip existing: ${tag.nameVi}`);
    }
  }
}
