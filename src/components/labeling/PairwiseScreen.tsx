import { StyleSheet, Text, View } from 'react-native';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import { ZoomablePreview } from '@/components/ZoomablePreview';
import type { PairwiseDecision, PairwisePresentation } from '@/utils/pairwisePresentation';

type Props = {
  question: string;
  presentation: PairwisePresentation;
  allowZoom?: boolean;
  onZoomUsed?: () => void;
  onDecision: (decision: PairwiseDecision) => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

export function PairwiseScreen({
  question,
  presentation,
  allowZoom,
  onZoomUsed,
  onDecision,
  onSkip,
  onUndo,
  allowUndo,
}: Props) {
  const isModelCompare = presentation.compareVariant === 'model_compare';
  const leftLabel = presentation.leftLabel ?? 'Left';
  const rightLabel = presentation.rightLabel ?? 'Right';
  const preferLeftLabel = isModelCompare ? 'Prefer A' : 'Left';
  const preferRightLabel = isModelCompare ? 'Prefer B' : 'Right';

  return (
    <View style={styles.root}>
      <Text style={styles.question}>{question}</Text>

      <View style={styles.compareRow}>
        <View style={styles.panel}>
          <Text style={[styles.panelLabel, isModelCompare && styles.panelLabelA]}>{leftLabel}</Text>
          <ZoomablePreview
            uri={presentation.left.previewUri}
            allowZoom={allowZoom}
            onZoomUsed={onZoomUsed}
          />
        </View>
        <View style={styles.panel}>
          <Text style={[styles.panelLabel, isModelCompare && styles.panelLabelB]}>{rightLabel}</Text>
          <ZoomablePreview
            uri={presentation.right.previewUri}
            allowZoom={allowZoom}
            onZoomUsed={onZoomUsed}
          />
        </View>
      </View>

      <View style={styles.primaryActions}>
        <LabelChoiceButton label={preferLeftLabel} tone="keep" onPress={() => onDecision('LEFT')} />
        <LabelChoiceButton label="Tie" tone="neutral" onPress={() => onDecision('EQUAL')} />
        <LabelChoiceButton
          label={preferRightLabel}
          tone={isModelCompare ? 'crop' : 'keep'}
          onPress={() => onDecision('RIGHT')}
        />
      </View>

      <View style={styles.secondaryActions}>
        {isModelCompare ? (
          <LabelChoiceButton
            label="Neither"
            tone="bad"
            flex={false}
            onPress={() => onDecision('NEITHER')}
          />
        ) : null}
        <LabelChoiceButton
          label={isModelCompare ? 'Unsure' : 'Cannot judge'}
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
  panelLabelA: {
    color: '#7FB1FF',
  },
  panelLabelB: {
    color: '#FFB46C',
  },
  primaryActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
});
