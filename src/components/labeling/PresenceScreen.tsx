import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { resolveLabelSwipe } from '@/utils/labelSwipe';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import { ZoomablePreview } from '@/components/ZoomablePreview';
import type { PresenceChoice } from '@/types/labeling';

type Props = {
  question: string;
  previewUri: string;
  allowZoom?: boolean;
  onZoomUsed?: () => void;
  onChoice: (choice: PresenceChoice) => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

export function PresenceScreen({
  question,
  previewUri,
  allowZoom,
  onZoomUsed,
  onChoice,
  onSkip,
  onUndo,
  allowUndo,
}: Props) {
  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .activeOffsetY([-24, 24])
    .onEnd((event) => {
      const direction = resolveLabelSwipe(event.translationX, event.translationY);
      if (direction === 'right') {
        onChoice('PRESENT');
      } else if (direction === 'left') {
        onChoice('ABSENT');
      } else if (direction === 'up') {
        onChoice('UNSURE');
      }
    })
    .runOnJS(true);

  return (
    <View style={styles.root}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.hint}>Swipe ► present · ◄ absent · ▲ unsure</Text>

      <GestureDetector gesture={swipe}>
        <View style={styles.previewWrap}>
          <ZoomablePreview uri={previewUri} allowZoom={allowZoom} onZoomUsed={onZoomUsed} />
        </View>
      </GestureDetector>

      <View style={styles.actions}>
        <LabelChoiceButton label="Present" tone="good" onPress={() => onChoice('PRESENT')} />
        <LabelChoiceButton label="Absent" tone="bad" onPress={() => onChoice('ABSENT')} />
        <LabelChoiceButton label="Unsure" tone="warning" onPress={() => onChoice('UNSURE')} />
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
    letterSpacing: 0.3,
  },
  previewWrap: {
    flex: 1,
    minHeight: 200,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
});
