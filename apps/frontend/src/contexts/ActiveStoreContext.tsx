'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getMyStores } from '../lib/api/stores';

export interface StoreListItem {
  id: string;
  name: string;
  status: string;
}

interface ActiveStoreContextValue {
  stores: StoreListItem[];
  activeStoreId: string | null;
  activeStore: StoreListItem | null;
  setActiveStoreId: (id: string) => void;
  refreshStores: () => Promise<void>;
  loading: boolean;
}

const STORAGE_KEY = 'active_store_id';

const ActiveStoreContext = createContext<ActiveStoreContextValue>({
  stores: [],
  activeStoreId: null,
  activeStore: null,
  setActiveStoreId: () => {},
  refreshStores: async () => {},
  loading: true,
});

export function useActiveStore() {
  return useContext(ActiveStoreContext);
}

export function ActiveStoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStores = useCallback(async () => {
    try {
      const res = await getMyStores();
      const list: StoreListItem[] = (res.data ?? res) as StoreListItem[];
      setStores(list);

      // Restore saved selection or default to first
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && list.some((s) => s.id === saved)) {
        setActiveStoreIdState(saved);
      } else if (list.length > 0) {
        setActiveStoreIdState(list[0].id);
        localStorage.setItem(STORAGE_KEY, list[0].id);
      }
    } catch {
      // ignore — auth might redirect
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStores(); }, [loadStores]);

  const setActiveStoreId = useCallback((id: string) => {
    setActiveStoreIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const activeStore = stores.find((s) => s.id === activeStoreId) ?? null;

  return (
    <ActiveStoreContext.Provider
      value={{
        stores,
        activeStoreId,
        activeStore,
        setActiveStoreId,
        refreshStores: loadStores,
        loading,
      }}
    >
      {children}
    </ActiveStoreContext.Provider>
  );
}
