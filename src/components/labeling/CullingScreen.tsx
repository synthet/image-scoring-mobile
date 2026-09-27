import { StyleSheet, Text, View } from 'react-native';

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

function ChoiceButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: 'pick' | 'keep' | 'reject' | 'neutral';
  onPress: () => void;
}) {
  return (
    <Text
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.choice, styles[`choice_${tone}`]]}
    >
      {label}
    </Text>
  );
}

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
        <ChoiceButton label="Reject" tone="reject" onPress={() => onChoice('REJECT')} />
        <ChoiceButton label="Keep" tone="keep" onPress={() => onChoice('KEEP')} />
        <ChoiceButton label="Pick" tone="pick" onPress={() => onChoice('PICK')} />
      </View>

      <View style={styles.secondary}>
        <ChoiceButton label="Skip" tone="neutral" onPress={onSkip} />
        {allowUndo && onUndo ? (
          <ChoiceButton label="Undo" tone="neutral" onPress={onUndo} />
        ) : null}
      </View>
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
  secondary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  choice: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '700',
    fontSize: 15,
    color: '#fff',
  },
  choice_pick: {
    backgroundColor: '#2E8B57',
  },
  choice_keep: {
    backgroundColor: '#2F6FAB',
  },
  choice_reject: {
    backgroundColor: '#9B3D3D',
  },
  choice_neutral: {
    flex: 0,
    minWidth: 88,
    backgroundColor: '#243040',
    color: '#C5D3E0',
    paddingHorizontal: 16,
  },
});
