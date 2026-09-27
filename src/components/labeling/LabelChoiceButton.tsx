import { Pressable, StyleSheet, Text } from 'react-native';

export type LabelChoiceTone =
  | 'pick'
  | 'keep'
  | 'reject'
  | 'good'
  | 'bad'
  | 'neutral';

type Props = {
  label: string;
  tone: LabelChoiceTone;
  onPress: () => void;
  flex?: boolean;
};

export function LabelChoiceButton({ label, tone, onPress, flex = true }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        flex ? styles.flex : styles.fixed,
        styles[`tone_${tone}`],
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, tone === 'neutral' && styles.labelNeutral]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  fixed: {
    minWidth: 88,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontWeight: '700',
    fontSize: 15,
    color: '#fff',
  },
  labelNeutral: {
    color: '#C5D3E0',
  },
  tone_pick: {
    backgroundColor: '#2E8B57',
  },
  tone_keep: {
    backgroundColor: '#2F6FAB',
  },
  tone_reject: {
    backgroundColor: '#9B3D3D',
  },
  tone_good: {
    backgroundColor: '#2E8B57',
  },
  tone_bad: {
    backgroundColor: '#9B3D3D',
  },
  tone_neutral: {
    backgroundColor: '#243040',
  },
});
