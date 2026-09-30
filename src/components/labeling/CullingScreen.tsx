import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { resolveLabelSwipe } from '@/utils/labelSwipe';

import { BurstLoupeModal } from '@/components/labeling/BurstLoupeModal';
import { BurstThumbnailStrip } from '@/components/labeling/BurstThumbnailStrip';
import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import { ZoomablePreview } from '@/components/ZoomablePreview';
import type { BurstLoupeFrame } from '@/services/burstLoupe';

type Props = {
  question: string;
  previewUri: string;
  allowZoom?: boolean;
  burstClusterId?: string;
  burstIndex?: number;
  burstSize?: number;
  burstLoupeFrames?: BurstLoupeFrame[];
  onZoomUsed?: () => void;
  onChoice: (choice: 'PICK' | 'KEEP' | 'REJECT', options?: { isBest?: boolean }) => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

export function CullingScreen({
  question,
  previewUri,
  allowZoom,
  burstClusterId,
  burstIndex,
  burstSize,
  burstLoupeFrames = [],
  onZoomUsed,
  onChoice,
  onSkip,
  onUndo,
  allowUndo,
}: Props) {
  const [starred, setStarred] = useState(false);
  const [loupeOpen, setLoupeOpen] = useState(false);
  const [loupeStartIndex, setLoupeStartIndex] = useState(0);
  const inBurst = Boolean(burstClusterId);
  const currentLoupeIndex = Math.max(
    0,
    burstLoupeFrames.findIndex((frame) => frame.isCurrent),
  );

  const openLoupe = (index: number) => {
    onZoomUsed?.();
    setLoupeStartIndex(index);
    setLoupeOpen(true);
  };

  const submit = (choice: 'PICK' | 'KEEP' | 'REJECT') => {
    onChoice(choice, starred ? { isBest: true } : undefined);
    setStarred(false);
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .activeOffsetY([-24, 24])
    .onEnd((event) => {
      const direction = resolveLabelSwipe(event.translationX, event.translationY);
      if (direction === 'right') {
        submit('KEEP');
      } else if (direction === 'left') {
        submit('REJECT');
      } else if (direction === 'up') {
        submit('PICK');
      }
    })
    .runOnJS(true);

  return (
    <View style={styles.root}>
      <Text style={styles.question}>{question}</Text>
      {inBurst ? (
        <Text style={styles.burstHint}>
          {burstIndex != null && burstSize != null
            ? `Shot ${burstIndex + 1} of ${burstSize} · `
            : 'Burst series · '}
          tap star if this is the best shot
        </Text>
      ) : null}
      <GestureDetector gesture={swipe}>
        <View style={styles.previewWrap}>
          <ZoomablePreview uri={previewUri} allowZoom={allowZoom} onZoomUsed={onZoomUsed} />
        </View>
      </GestureDetector>

      {inBurst && burstLoupeFrames.length > 1 ? (
        <>
          <BurstThumbnailStrip
            frames={burstLoupeFrames}
            onSelect={(index) => openLoupe(index)}
          />
          <Pressable
            accessibilityRole="button"
            style={styles.loupeBtn}
            onPress={() => openLoupe(currentLoupeIndex)}
          >
            <Text style={styles.loupeBtnText}>
              Open burst loupe ({burstLoupeFrames.length} shots)
            </Text>
          </Pressable>
        </>
      ) : null}

      <BurstLoupeModal
        visible={loupeOpen}
        frames={burstLoupeFrames}
        initialIndex={loupeStartIndex}
        onClose={() => setLoupeOpen(false)}
        onZoomUsed={onZoomUsed}
      />

      <View style={styles.gestureHint}>
        <Text style={styles.hintText}>REJECT ◄   ► KEEP</Text>
        <Text style={styles.hintPick}>▲ PICK</Text>
      </View>

      {inBurst ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setStarred((v) => !v)}
          style={[styles.starBtn, starred && styles.starBtnActive]}
        >
          <Text style={[styles.starLabel, starred && styles.starLabelActive]}>
            {starred ? '★ Best in burst' : '☆ Mark best in burst'}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <LabelChoiceButton label="Reject" tone="reject" onPress={() => submit('REJECT')} />
        <LabelChoiceButton label="Keep" tone="keep" onPress={() => submit('KEEP')} />
        <LabelChoiceButton label="Pick" tone="pick" onPress={() => submit('PICK')} />
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
  burstHint: {
    color: '#58A6FF',
    fontSize: 12,
    paddingHorizontal: 16,
  },
  previewWrap: {
    flex: 1,
    minHeight: 200,
  },
  loupeBtn: {
    marginHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#344B63',
    alignItems: 'center',
    backgroundColor: '#141C26',
  },
  loupeBtnText: {
    color: '#C5D3E0',
    fontWeight: '600',
    fontSize: 13,
  },
  starBtn: {
    marginHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#243040',
    alignItems: 'center',
  },
  starBtnActive: {
    borderColor: '#58A6FF',
    backgroundColor: '#1A2838',
  },
  starLabel: {
    color: '#9FB0C3',
    fontWeight: '600',
    fontSize: 14,
  },
  starLabelActive: {
    color: '#58A6FF',
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
