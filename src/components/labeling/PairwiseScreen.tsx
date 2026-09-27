import { StyleSheet, Text, View } from 'react-native';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import { ZoomablePreview } from '@/components/ZoomablePreview';
import type { PairwiseDecision, PairwisePresentation } from '@/utils/pairwisePresentation';

type Props = {
  question: string;
  presentation: PairwisePresentation;
  allowZoom?: boolean;
  onDecision: (decision: PairwiseDecision) => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

export function PairwiseScreen({
  question,
  presentation,
  allowZoom,
  onDecision,
  onSkip,
  onUndo,
  allowUndo,
}: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.question}>{question}</Text>

      <View style={styles.compareRow}>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Left</Text>
          <ZoomablePreview uri={presentation.left.previewUri} allowZoom={allowZoom} />
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Right</Text>
          <ZoomablePreview uri={presentation.right.previewUri} allowZoom={allowZoom} />
        </View>
      </View>

      <View style={styles.primaryActions}>
        <LabelChoiceButton label="Left" tone="keep" onPress={() => onDecision('LEFT')} />
        <LabelChoiceButton label="Equal" tone="neutral" onPress={() => onDecision('EQUAL')} />
        <LabelChoiceButton label="Right" tone="keep" onPress={() => onDecision('RIGHT')} />
      </View>

      <View style={styles.cannotJudgeWrap}>
        <LabelChoiceButton
          label="Cannot judge"
          tone="neutral"
          flex={false}
          onPress={() => onDecision('CANNOT_JUDGE')}
        />
      </View>

      <LabelSecondaryActions onSkip={onSkip} onUndo={onUndo} allowUndo={allowUndo} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 8,
    paddingBottom: 12,
  },
  question: {
    color: '#E8EEF5',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  compareRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    minHeight: 220,
  },
  panel: {
    flex: 1,
    gap: 4,
  },
  panelLabel: {
    textAlign: 'center',
    color: '#7E92A8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  primaryActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  cannotJudgeWrap: {
    alignItems: 'center',
  },
});
