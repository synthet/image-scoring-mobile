import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import { ZoomablePreview } from '@/components/ZoomablePreview';
import type { ChoiceSpec } from '@/labeling/taskSpec';
import { resolveLabelSwipe } from '@/utils/labelSwipe';

type Props = {
  question: string;
  previewUri: string;
  choices: ChoiceSpec[];
  enableSwipe?: boolean;
  allowZoom?: boolean;
  onZoomUsed?: () => void;
  onChoice: (choiceId: string) => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
  hint?: string;
};

export function ChoiceTaskScreen({
  question,
  previewUri,
  choices,
  enableSwipe,
  allowZoom,
  onZoomUsed,
  onChoice,
  onSkip,
  onUndo,
  allowUndo,
  hint,
}: Props) {
  const swipeChoiceByDirection = new Map(
    choices.filter((c) => c.swipe).map((c) => [c.swipe!, c.id] as const),
  );

  const swipe = Gesture.Pan()
    .enabled(Boolean(enableSwipe))
    .activeOffsetX([-24, 24])
    .activeOffsetY([-24, 24])
    .onEnd((event) => {
      const direction = resolveLabelSwipe(event.translationX, event.translationY);
      if (!direction) {
        return;
      }
      const choiceId = swipeChoiceByDirection.get(direction);
      if (choiceId) {
        onChoice(choiceId);
      }
    })
    .runOnJS(true);

  return (
    <View style={styles.root}>
      <Text style={styles.question}>{question}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <GestureDetector gesture={swipe}>
        <View style={styles.previewWrap}>
          <ZoomablePreview uri={previewUri} allowZoom={allowZoom} onZoomUsed={onZoomUsed} />
        </View>
      </GestureDetector>

      <View style={styles.actions}>
        {choices.map((choice) => (
          <LabelChoiceButton
            key={choice.id}
            label={choice.label}
            tone={choice.tone ?? 'neutral'}
            onPress={() => onChoice(choice.id)}
          />
        ))}
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
    paddingHorizontal: 16,
  },
  previewWrap: {
    flex: 1,
    minHeight: 200,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
});
