import { StyleSheet, Text, View } from 'react-native';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import { ZoomablePreview } from '@/components/ZoomablePreview';

type Props = {
  question: string;
  previewUri: string;
  allowZoom?: boolean;
  onChoice: (choice: 'PICK' | 'KEEP' | 'REJECT') => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

export function CullingScreen({
  question,
  previewUri,
  allowZoom,
  onChoice,
  onSkip,
  onUndo,
  allowUndo,
}: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.question}>{question}</Text>
      <ZoomablePreview uri={previewUri} allowZoom={allowZoom} />

      <View style={styles.gestureHint}>
        <Text style={styles.hintText}>REJECT ◄   ► KEEP</Text>
        <Text style={styles.hintPick}>▲ PICK</Text>
      </View>

      <View style={styles.actions}>
        <LabelChoiceButton label="Reject" tone="reject" onPress={() => onChoice('REJECT')} />
        <LabelChoiceButton label="Keep" tone="keep" onPress={() => onChoice('KEEP')} />
        <LabelChoiceButton label="Pick" tone="pick" onPress={() => onChoice('PICK')} />
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
  gestureHint: {
    alignItems: 'center',
    gap: 2,
  },
  hintText: {
    color: '#7E92A8',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  hintPick: {
    color: '#6BCB8E',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 8,
  },
});
