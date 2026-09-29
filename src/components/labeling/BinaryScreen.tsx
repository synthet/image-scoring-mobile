import { StyleSheet, Text, View } from 'react-native';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import { ZoomablePreview } from '@/components/ZoomablePreview';

type Props = {
  question: string;
  previewUri: string;
  allowZoom?: boolean;
  onZoomUsed?: () => void;
  onChoice: (choice: 'GOOD' | 'BAD') => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

export function BinaryScreen({
  question,
  previewUri,
  allowZoom,
  onZoomUsed,
  onChoice,
  onSkip,
  onUndo,
  allowUndo,
}: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.question}>{question}</Text>
      <ZoomablePreview uri={previewUri} allowZoom={allowZoom} onZoomUsed={onZoomUsed} />

      <Text style={styles.hint}>◄ BAD · GOOD ►</Text>

      <View style={styles.actions}>
        <LabelChoiceButton label="Bad" tone="bad" onPress={() => onChoice('BAD')} />
        <LabelChoiceButton label="Good" tone="good" onPress={() => onChoice('GOOD')} />
      </View>

      <LabelSecondaryActions onSkip={onSkip} onUndo={onUndo} allowUndo={allowUndo} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 10,
    paddingBottom: 16,
  },
  question: {
    color: '#E8EEF5',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  hint: {
    textAlign: 'center',
    color: '#7E92A8',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
});
