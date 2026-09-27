import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LabelEngine } from '@/components/labeling/LabelEngine';
import { ProgressHeader } from '@/components/ProgressHeader';
import { getBatchProgress, listBatches } from '@/db/repository';
import { useSyncWorker } from '@/hooks/useSyncWorker';
import type { LabelMode } from '@/types/labeling';

export default function LabelBatchScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const db = useSQLiteContext();
  const { pendingCount, syncNow } = useSyncWorker();
  const [meta, setMeta] = useState<{
    mode: LabelMode;
    question: string;
    total: number;
    completed: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      if (!batchId) {
        return;
      }
      const batches = await listBatches(db);
      const batch = batches.find((b) => b.id === batchId);
      const progress = await getBatchProgress(db, batchId);
      if (batch) {
        setMeta({
          mode: batch.mode as LabelMode,
          question: batch.question,
          total: progress.total,
          completed: progress.completed,
        });
      }
    })();
  }, [batchId, db]);

  useEffect(() => {
    const interval = setInterval(() => {
      void syncNow();
      if (!batchId) {
        return;
      }
      void getBatchProgress(db, batchId).then((p) => {
        setMeta((m) => (m ? { ...m, ...p } : m));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [batchId, db, syncNow]);

  if (!batchId || !meta) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <ProgressHeader completed={meta.completed} total={meta.total} pendingSync={pendingCount} />
      <LabelEngine batchId={batchId} mode={meta.mode} question={meta.question} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
