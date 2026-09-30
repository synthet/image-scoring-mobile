import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { TaskWorkspace } from '@/components/labeling/TaskWorkspace';
import { useLabelSession } from '@/hooks/useLabelSession';
import { resolveTaskSpec } from '@/labeling/taskSpec';
import type { LabelMode } from '@/types/labeling';

type Props = {
  batchId: string;
  mode: LabelMode;
  question: string;
};

export function LabelEngine({ batchId, mode: _mode, question }: Props) {
  const session = useLabelSession(batchId);

  if (session.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4DA3FF" />
      </View>
    );
  }

  const task = session.task;
  const spec = task ? resolveTaskSpec(task) : null;

  const taskReady =
    task &&
    spec &&
    (spec.layout === 'pairwise_images'
      ? session.pairwise != null
      : spec.layout === 'dual_image'
        ? session.boxQuality != null
        : session.previewUri != null);

  if (!taskReady) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>Batch complete</Text>
        <Text style={styles.doneBody}>
          All tasks in this batch are labeled locally. Results will upload when the hub is reachable.
        </Text>
      </View>
    );
  }

  return <TaskWorkspace session={session} question={question} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  doneTitle: {
    color: '#E8EEF5',
    fontSize: 20,
    fontWeight: '700',
  },
  doneBody: {
    color: '#9FB0C3',
    textAlign: 'center',
    lineHeight: 20,
  },
});
