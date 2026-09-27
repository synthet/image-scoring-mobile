import { StyleSheet, View } from 'react-native';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';

type Props = {
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

export function LabelSecondaryActions({ onSkip, onUndo, allowUndo }: Props) {
  return (
    <View style={styles.row}>
      <LabelChoiceButton label="Skip" tone="neutral" flex={false} onPress={onSkip} />
      {allowUndo && onUndo ? (
        <LabelChoiceButton label="Undo" tone="neutral" flex={false} onPress={onUndo} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
});
