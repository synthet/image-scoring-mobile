import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { Alert, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import type { GeometrySubmitPayload } from '@/labeling/annotationPayload';
import type { ChoiceSpec, ResolvedTaskSpec } from '@/labeling/taskSpec';
import {
  isValidNormalizedRect,
  pointInOverlay,
  rectFromPoints,
  roundNormalizedRect,
  type NormalizedRect,
} from '@/utils/normalizedRect';

type Props = {
  question: string;
  previewUri: string;
  imageId: string;
  spec: ResolvedTaskSpec;
  priorChoice?: string;
  onZoomUsed?: () => void;
  onSubmit: (payload: GeometrySubmitPayload) => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

function RectOverlay({ rect, draft }: { rect: NormalizedRect; draft?: boolean }) {
  const [x1, y1, x2, y2] = rect;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.drawnRect,
        draft && styles.draftRect,
        {
          left: `${x1 * 100}%`,
          top: `${y1 * 100}%`,
          width: `${(x2 - x1) * 100}%`,
          height: `${(y2 - y1) * 100}%`,
        },
      ]}
    />
  );
}

export function GeometryAnnotateScreen({
  question,
  previewUri,
  imageId,
  spec,
  priorChoice,
  onZoomUsed,
  onSubmit,
  onSkip,
  onUndo,
  allowUndo,
}: Props) {
  const choices = spec.choices;
  const defaultChoice = priorChoice ?? choices[0]?.id ?? 'UNKNOWN';
  const [boxes, setBoxes] = useState<NormalizedRect[]>([]);
  const [choiceId, setChoiceId] = useState(defaultChoice);
  const [draft, setDraft] = useState<NormalizedRect | null>(null);
  const [actualPixels, setActualPixels] = useState(false);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const onOverlayLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setOverlaySize({ width, height });
  }, []);

  const applyChoice = useCallback(
    (nextId: string) => {
      const requiresBoxes = spec.requireBoxesForChoiceIds.has(nextId);
      if (!requiresBoxes && boxes.length > 0) {
        Alert.alert('Clear boxes?', 'This choice cannot include drawn regions.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              setBoxes([]);
              setChoiceId(nextId);
            },
          },
        ]);
        return;
      }
      if (!requiresBoxes) {
        setBoxes([]);
      }
      setChoiceId(nextId);
    },
    [boxes.length, spec.requireBoxesForChoiceIds],
  );

  const pan = useMemo(() => {
    const { width, height } = overlaySize;
    const promote = spec.promoteChoiceOnDraw;
    const drag = { start: null as [number, number] | null };

    return Gesture.Pan()
      .onBegin((event) => {
        const start = pointInOverlay(event.x, event.y, width, height);
        drag.start = start;
        setDraft(rectFromPoints(start, start));
      })
      .onUpdate((event) => {
        if (!drag.start) {
          return;
        }
        const end = pointInOverlay(event.x, event.y, width, height);
        setDraft(rectFromPoints(drag.start, end));
      })
      .onEnd((event) => {
        if (!drag.start) {
          return;
        }
        const end = pointInOverlay(event.x, event.y, width, height);
        const candidate = roundNormalizedRect(rectFromPoints(drag.start, end));
        drag.start = null;
        setDraft(null);
        if (isValidNormalizedRect(candidate)) {
          if (promote) {
            setChoiceId(promote);
          }
          setBoxes((prev) => [...prev, candidate]);
          onZoomUsed?.();
        }
      })
      .onFinalize(() => {
        drag.start = null;
        setDraft(null);
      })
      .runOnJS(true);
  }, [onZoomUsed, overlaySize, spec.promoteChoiceOnDraw]);

  const markReviewed = () => {
    if (spec.requireBoxesForChoiceIds.has(choiceId) && boxes.length === 0) {
      Alert.alert('Regions required', 'Draw at least one region before submitting this choice.');
      return;
    }
    if (!spec.requireBoxesForChoiceIds.has(choiceId) && boxes.length > 0) {
      Alert.alert('Remove regions', 'Clear drawn regions or switch to a choice that allows boxes.');
      return;
    }
    onSubmit({
      choiceId,
      boxes: spec.requireBoxesForChoiceIds.has(choiceId) ? boxes : [],
      priorChoice,
      imageId,
    });
    setBoxes([]);
    setChoiceId(defaultChoice);
  };

  const imageWidth = actualPixels && overlaySize.width > 0 ? overlaySize.width * 1.35 : overlaySize.width;

  return (
    <View style={styles.root}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.meta}>
        {imageId} · {boxes.length} regions{priorChoice ? ` · prior ${priorChoice}` : ''}
      </Text>

      <ScrollView style={styles.viewport} contentContainerStyle={styles.viewportContent}>
        <View
          style={[styles.stage, actualPixels && imageWidth > 0 ? { width: imageWidth } : styles.stageFit]}
          onLayout={onOverlayLayout}
        >
          <Image source={{ uri: previewUri }} style={styles.photo} contentFit="contain" transition={150} />
          <GestureDetector gesture={pan}>
            <View style={StyleSheet.absoluteFill}>
              {boxes.map((rect, index) => (
                <RectOverlay key={`${index}-${rect.join(',')}`} rect={rect} />
              ))}
              {draft ? <RectOverlay rect={draft} draft /> : null}
            </View>
          </GestureDetector>
        </View>
      </ScrollView>

      <Pressable style={styles.actualBtn} onPress={() => setActualPixels((v) => !v)}>
        <Text style={styles.actualBtnText}>{actualPixels ? 'Fit window' : 'Actual pixels'}</Text>
      </Pressable>

      <View style={styles.choiceRow}>
        {choices.map((choice: ChoiceSpec) => (
          <LabelChoiceButton
            key={choice.id}
            label={choice.label}
            tone={choice.tone ?? 'neutral'}
            onPress={() => applyChoice(choice.id)}
          />
        ))}
      </View>

      <View style={styles.toolRow}>
        <LabelChoiceButton label="Undo region" tone="neutral" flex={false} onPress={() => setBoxes((b) => b.slice(0, -1))} />
        <LabelChoiceButton
          label="Clear"
          tone="neutral"
          flex={false}
          onPress={() => {
            Alert.alert('Clear all regions?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => setBoxes([]) },
            ]);
          }}
        />
      </View>

      <LabelChoiceButton label="Submit" tone="pick" onPress={markReviewed} />
      <LabelSecondaryActions onSkip={onSkip} onUndo={onUndo} allowUndo={allowUndo} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 8, paddingBottom: 12 },
  question: {
    color: '#E8EEF5',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  meta: { color: '#7E92A8', fontSize: 12, paddingHorizontal: 16 },
  viewport: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#171717',
    marginHorizontal: 8,
    borderRadius: 12,
  },
  viewportContent: { flexGrow: 1, justifyContent: 'center' },
  stage: { position: 'relative', alignSelf: 'center', minHeight: 220 },
  stageFit: { width: '100%', aspectRatio: 4 / 3 },
  photo: { width: '100%', height: '100%' },
  drawnRect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#24DE6A',
    backgroundColor: 'rgba(36, 222, 106, 0.2)',
  },
  draftRect: {
    borderColor: '#FFCC00',
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
  },
  actualBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12 },
  actualBtnText: { color: '#58A6FF', fontWeight: '600', fontSize: 13 },
  choiceRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, flexWrap: 'wrap' },
  toolRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
