const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface TagItem {
  id: number;
  nameVi: string;
  nameEn: string;
}

export interface TagGroup {
  groupType: 'dish_type' | 'flavor' | 'allergen';
  label: string;
  tags: TagItem[];
}

export interface TagsGroupedResponse {
  groups: TagGroup[];
}

export async function fetchTags(): Promise<TagsGroupedResponse> {
  const res = await fetch(`${API_URL}/tags`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Không thể tải danh sách nhãn.');
  const json = await res.json() as { data: TagsGroupedResponse };
  return json.data;
}
