import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BinaryScreen } from '@/components/labeling/BinaryScreen';
import { CullingScreen } from '@/components/labeling/CullingScreen';
import { useLabelSession } from '@/hooks/useLabelSession';
import type { LabelMode } from '@/types/labeling';

type Props = {
  batchId: string;
  mode: LabelMode;
  question: string;
};

export function LabelEngine({ batchId, mode, question }: Props) {
  const session = useLabelSession(batchId);

  if (session.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4DA3FF" />
      </View>
    );
  }

  if (!session.task || !session.previewUri) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>Batch complete</Text>
        <Text style={styles.doneBody}>
          All tasks in this batch are labeled locally. Results will upload when the hub is reachable.
        </Text>
      </View>
    );
  }

  const screenProps = {
    question,
    previewUri: session.previewUri,
    allowZoom: session.allowZoom,
    allowUndo: session.allowUndo,
    onSkip: () => void session.skipTask(),
    onUndo: () => void session.undo(),
  };

  if (mode === 'culling') {
    return (
      <CullingScreen
        {...screenProps}
        onChoice={(choice) => void session.submitChoice(choice)}
      />
    );
  }

  if (mode === 'binary') {
    return (
      <BinaryScreen
        {...screenProps}
        onChoice={(choice) => void session.submitChoice(choice)}
      />
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.doneTitle}>Mode not implemented yet</Text>
      <Text style={styles.doneBody}>Mode "{mode}" will share the same offline task pipeline.</Text>
    </View>
  );
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
