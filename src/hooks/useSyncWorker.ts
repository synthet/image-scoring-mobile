import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { countPendingSync } from '@/db/repository';
import { flushAnnotationOutbox } from '@/services/syncOutbox';

const SYNC_INTERVAL_MS = 15_000;

export function useSyncWorker(enabled = true): {
  pendingCount: number;
  syncNow: () => Promise<void>;
  lastSyncedAt: string | null;
} {
  const db = useSQLiteContext();
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const syncing = useRef(false);

  const refreshPending = useCallback(async () => {
    const count = await countPendingSync(db);
    setPendingCount(count);
  }, [db]);

  const syncNow = useCallback(async () => {
    if (syncing.current) {
      return;
    }
    syncing.current = true;
    try {
      await flushAnnotationOutbox(db);
      setLastSyncedAt(new Date().toISOString());
    } finally {
      syncing.current = false;
      await refreshPending();
    }
  }, [db, refreshPending]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    queueMicrotask(() => {
      void refreshPending();
    });
    const interval = setInterval(() => {
      void syncNow();
    }, SYNC_INTERVAL_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void syncNow();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [enabled, refreshPending, syncNow]);

  return { pendingCount, syncNow, lastSyncedAt };
}
