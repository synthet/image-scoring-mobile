import { Link, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listRemoteBatches } from '@/api/labelingHubClient';
import { ProgressHeader } from '@/components/ProgressHeader';
import { listBatches, type BatchSummary } from '@/db/repository';
import { createDemoCullingBatch } from '@/fixtures/demoBatch';
import { useSyncWorker } from '@/hooks/useSyncWorker';
import { importBatchLocally, warmBatchAssetCache } from '@/services/batchImport';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const { pendingCount, syncNow } = useSyncWorker();
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [hubError, setHubError] = useState<string | null>(null);

  const reloadLocal = useCallback(async () => {
    setBatches(await listBatches(db));
  }, [db]);

  useEffect(() => {
    void reloadLocal();
  }, [reloadLocal]);

  const refreshFromHub = useCallback(async () => {
    setRefreshing(true);
    setHubError(null);
    try {
      const remote = await listRemoteBatches();
      for (const batch of remote) {
        await importBatchLocally(db, batch);
      }
      await reloadLocal();
    } catch (err) {
      setHubError(err instanceof Error ? err.message : 'Hub unavailable');
    } finally {
      setRefreshing(false);
    }
  }, [db, reloadLocal]);

  const loadDemoBatch = useCallback(async () => {
    setBusy('demo');
    try {
      const batch = await createDemoCullingBatch();
      await importBatchLocally(db, batch);
      await warmBatchAssetCache(db, batch);
      await reloadLocal();
      router.push(`/label/${batch.id}`);
    } finally {
      setBusy(null);
    }
  }, [db, reloadLocal]);

  const openBatch = useCallback(
    async (batchId: string) => {
      setBusy(batchId);
      try {
        await syncNow();
        router.push(`/label/${batchId}`);
      } finally {
        setBusy(null);
      }
    },
    [syncNow],
  );

  const totalCompleted = batches.reduce((sum, b) => sum + b.completedTasks, 0);
  const totalTasks = batches.reduce((sum, b) => sum + b.totalTasks, 0);

  return (
    <View style={styles.root}>
      <ProgressHeader completed={totalCompleted} total={totalTasks} pendingSync={pendingCount} />

      {hubError ? <Text style={styles.error}>{hubError}</Text> : null}

      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refreshFromHub()} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No batches cached yet</Text>
            <Text style={styles.emptyBody}>
              Pull to refresh from the labeling hub, or run the offline demo batch.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => void openBatch(item.id)}>
            <Text style={styles.cardTitle}>{item.experimentId}</Text>
            <Text style={styles.cardMeta}>
              {item.mode} · {item.completedTasks}/{item.totalTasks}
            </Text>
            <Text style={styles.cardQuestion} numberOfLines={2}>
              {item.question}
            </Text>
            {busy === item.id ? <ActivityIndicator color="#4DA3FF" style={styles.cardSpinner} /> : null}
          </Pressable>
        )}
        contentContainerStyle={batches.length === 0 ? styles.listEmpty : undefined}
      />

      <View style={styles.footer}>
        <Pressable style={styles.primaryBtn} onPress={() => void loadDemoBatch()} disabled={busy === 'demo'}>
          {busy === 'demo' ? (
            <ActivityIndicator color="#0B0F14" />
          ) : (
            <Text style={styles.primaryBtnText}>Load demo culling batch</Text>
          )}
        </Pressable>
        <Link href="/settings" asChild>
          <Pressable style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>Settings</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: {
    color: '#F08A8A',
    paddingHorizontal: 16,
    marginBottom: 4,
    fontSize: 13,
  },
  listEmpty: { flexGrow: 1 },
  empty: {
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    color: '#E8EEF5',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    color: '#9FB0C3',
    lineHeight: 20,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#141C26',
    gap: 4,
  },
  cardTitle: {
    color: '#E8EEF5',
    fontWeight: '700',
    fontSize: 16,
  },
  cardMeta: {
    color: '#7E92A8',
    fontSize: 12,
  },
  cardQuestion: {
    color: '#C5D3E0',
    fontSize: 14,
    marginTop: 4,
  },
  cardSpinner: { marginTop: 8 },
  footer: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#243040',
  },
  primaryBtn: {
    backgroundColor: '#4DA3FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0B0F14',
    fontWeight: '700',
    fontSize: 15,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkBtnText: {
    color: '#9FB0C3',
    fontSize: 14,
  },
});
