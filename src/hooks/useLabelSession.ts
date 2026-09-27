import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { APP_VERSION } from '@/config/env';
import {
  getBatchConfig,
  getNextPendingTask,
  markTaskStatus,
  saveAnnotation,
  undoLastAnnotation,
} from '@/db/repository';
import { resolvePreviewUri } from '@/services/assetCache';
import { getOrCreateDeviceId } from '@/services/device';
import type { AnnotationEvent, LabelTask } from '@/types/labeling';

export function useLabelSession(batchId: string): {
  task: LabelTask | null;
  previewUri: string | null;
  loading: boolean;
  submitChoice: (choice: string) => Promise<void>;
  skipTask: () => Promise<void>;
  undo: () => Promise<void>;
  allowUndo: boolean;
  allowZoom: boolean;
  taskStartedAt: number;
} {
  const db = useSQLiteContext();
  const [task, setTask] = useState<LabelTask | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowUndo, setAllowUndo] = useState(true);
  const [allowZoom, setAllowZoom] = useState(true);
  const taskStartedAt = useRef(Date.now());

  const loadNext = useCallback(async () => {
    setLoading(true);
    const config = await getBatchConfig(db, batchId);
    setAllowUndo(config.allowUndo);
    setAllowZoom(config.allowZoom);

    const next = await getNextPendingTask(db, batchId);
    setTask(next);
    taskStartedAt.current = Date.now();

    if (!next || next.items.length === 0) {
      setPreviewUri(null);
      setLoading(false);
      return;
    }

    const remote = next.items[0].assets.preview;
    try {
      const local = await resolvePreviewUri(db, remote);
      setPreviewUri(local);
    } catch {
      setPreviewUri(remote);
    }
    setLoading(false);
  }, [batchId, db]);

  useEffect(() => {
    void loadNext();
  }, [loadNext]);

  const persistAnnotation = useCallback(
    async (answer: AnnotationEvent['answer']) => {
      if (!task) {
        return;
      }
      const deviceId = await getOrCreateDeviceId();
      const event: AnnotationEvent = {
        annotationId: Crypto.randomUUID(),
        taskId: task.id,
        experimentId: task.experimentId,
        schemaVersion: task.schemaVersion,
        answer,
        client: {
          deviceId,
          appVersion: APP_VERSION,
        },
        interaction: {
          durationMs: Date.now() - taskStartedAt.current,
          zoomUsed: false,
        },
        createdAt: new Date().toISOString(),
      };

      await saveAnnotation(db, event, batchId);
      await markTaskStatus(db, task.id, batchId, answer.skipped ? 'skipped' : 'completed');
      await loadNext();
    },
    [batchId, db, loadNext, task],
  );

  const submitChoice = useCallback(
    async (choice: string) => {
      await persistAnnotation({ choice });
    },
    [persistAnnotation],
  );

  const skipTask = useCallback(async () => {
    await persistAnnotation({ skipped: true });
  }, [persistAnnotation]);

  const undo = useCallback(async () => {
    const restored = await undoLastAnnotation(db, batchId);
    if (restored) {
      setTask(restored);
      taskStartedAt.current = Date.now();
      const remote = restored.items[0]?.assets.preview;
      if (remote) {
        try {
          setPreviewUri(await resolvePreviewUri(db, remote));
        } catch {
          setPreviewUri(remote);
        }
      }
    }
  }, [batchId, db]);

  return {
    task,
    previewUri,
    loading,
    submitChoice,
    skipTask,
    undo,
    allowUndo,
    allowZoom,
    taskStartedAt: taskStartedAt.current,
  };
}
