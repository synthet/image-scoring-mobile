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
import {
  loadBoxQualityPresentation,
  loadPairwisePresentation,
  loadSinglePreview,
  type BoxQualityPresentation,
} from '@/services/taskPreviews';
import { getOrCreateDeviceId } from '@/services/device';
import type { AnnotationEvent, LabelTask } from '@/types/labeling';
import {
  pairwiseAnswerFromDecision,
  type PairwiseDecision,
  type PairwisePresentation,
} from '@/utils/pairwisePresentation';

export function useLabelSession(batchId: string): {
  task: LabelTask | null;
  previewUri: string | null;
  boxQuality: BoxQualityPresentation | null;
  pairwise: PairwisePresentation | null;
  loading: boolean;
  submitChoice: (choice: string, options?: { isBest?: boolean }) => Promise<void>;
  submitPairwiseChoice: (decision: PairwiseDecision) => Promise<void>;
  skipTask: () => Promise<void>;
  undo: () => Promise<void>;
  allowUndo: boolean;
  allowZoom: boolean;
  recordZoomUsed: () => void;
} {
  const db = useSQLiteContext();
  const [task, setTask] = useState<LabelTask | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [boxQuality, setBoxQuality] = useState<BoxQualityPresentation | null>(null);
  const [pairwise, setPairwise] = useState<PairwisePresentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowUndo, setAllowUndo] = useState(true);
  const [allowZoom, setAllowZoom] = useState(true);
  const taskStartedAt = useRef(0);
  const zoomUsedRef = useRef(false);
  const zoomCountRef = useRef(0);

  const recordZoomUsed = useCallback(() => {
    zoomUsedRef.current = true;
    zoomCountRef.current += 1;
  }, []);

  const hydrateTask = useCallback(
    async (next: LabelTask | null) => {
      setTask(next);
      taskStartedAt.current = Date.now();
      zoomUsedRef.current = false;
      zoomCountRef.current = 0;

      if (!next || next.items.length === 0) {
        setPreviewUri(null);
        setBoxQuality(null);
        setPairwise(null);
        return;
      }

      if (next.mode === 'pairwise') {
        setPreviewUri(null);
        setBoxQuality(null);
        setPairwise(await loadPairwisePresentation(db, next));
        return;
      }

      if (next.mode === 'box_quality') {
        setPairwise(null);
        setPreviewUri(null);
        setBoxQuality(await loadBoxQualityPresentation(db, next));
        return;
      }

      setPairwise(null);
      setBoxQuality(null);
      setPreviewUri(await loadSinglePreview(db, next));
    },
    [db],
  );

  const loadNext = useCallback(async () => {
    setLoading(true);
    const config = await getBatchConfig(db, batchId);
    setAllowUndo(config.allowUndo);
    setAllowZoom(config.allowZoom);

    const next = await getNextPendingTask(db, batchId);
    await hydrateTask(next);
    setLoading(false);
  }, [batchId, db, hydrateTask]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadNext();
    });
  }, [loadNext]);

  const persistAnnotation = useCallback(
    async (answer: AnnotationEvent['answer']) => {
      if (!task) {
        return;
      }
      const deviceId = await getOrCreateDeviceId();
      const startedAt = taskStartedAt.current > 0 ? taskStartedAt.current : Date.now();
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
          durationMs: Date.now() - startedAt,
          zoomUsed: zoomUsedRef.current,
          zoomCount: zoomCountRef.current > 0 ? zoomCountRef.current : undefined,
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
    async (choice: string, options?: { isBest?: boolean }) => {
      await persistAnnotation({
        choice,
        ...(options?.isBest ? { isBest: true } : {}),
      });
    },
    [persistAnnotation],
  );

  const submitPairwiseChoice = useCallback(
    async (decision: PairwiseDecision) => {
      if (!pairwise) {
        return;
      }
      await persistAnnotation(pairwiseAnswerFromDecision(decision, pairwise));
    },
    [pairwise, persistAnnotation],
  );

  const skipTask = useCallback(async () => {
    await persistAnnotation({ skipped: true });
  }, [persistAnnotation]);

  const undo = useCallback(async () => {
    const restored = await undoLastAnnotation(db, batchId);
    if (restored) {
      await hydrateTask(restored);
    }
  }, [batchId, db, hydrateTask]);

  return {
    task,
    previewUri,
    boxQuality,
    pairwise,
    loading,
    submitChoice,
    submitPairwiseChoice,
    skipTask,
    undo,
    allowUndo,
    allowZoom,
    recordZoomUsed,
  };
}
