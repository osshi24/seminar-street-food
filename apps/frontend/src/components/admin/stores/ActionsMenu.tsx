'use client';

import AdminActionsMenu, { type AdminActionItem } from '../common/AdminActionsMenu';

interface LegacyActionItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  icon?: string;
  disabled?: boolean;
}

interface ActionsMenuProps {
  items: LegacyActionItem[];
}

export default function ActionsMenu({ items }: ActionsMenuProps) {
  const mapped: AdminActionItem[] = items.map(({ icon: _icon, ...rest }) => rest);
  return <AdminActionsMenu items={mapped} />;
}
