import { StyleSheet, Text, View } from 'react-native';

import { LabelChoiceButton } from '@/components/labeling/LabelChoiceButton';
import { LabelSecondaryActions } from '@/components/labeling/LabelSecondaryActions';
import { ZoomablePreview } from '@/components/ZoomablePreview';
import type { BoundingBox, BoxQualityChoice } from '@/types/labeling';

type Props = {
  question: string;
  previewUri: string;
  subjectCropUri: string;
  detectorBox?: BoundingBox;
  allowZoom?: boolean;
  onZoomUsed?: () => void;
  onChoice: (choice: BoxQualityChoice) => void;
  onSkip: () => void;
  onUndo?: () => void;
  allowUndo?: boolean;
};

export function BoxQualityScreen({
  question,
  previewUri,
  subjectCropUri,
  detectorBox,
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

      <View style={styles.stage}>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Full frame</Text>
          <ZoomablePreview
            uri={previewUri}
            allowZoom={allowZoom}
            detectorBox={detectorBox}
            onZoomUsed={onZoomUsed}
          />
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Subject crop</Text>
          <ZoomablePreview uri={subjectCropUri} allowZoom={allowZoom} onZoomUsed={onZoomUsed} />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <LabelChoiceButton label="Usable" tone="good" onPress={() => onChoice('USABLE')} />
        <LabelChoiceButton label="Poor crop" tone="crop" onPress={() => onChoice('POOR_CROP')} />
      </View>
      <View style={styles.actionsRow}>
        <LabelChoiceButton label="Wrong target" tone="bad" onPress={() => onChoice('WRONG_TARGET')} />
        <LabelChoiceButton label="Unsure" tone="neutral" onPress={() => onChoice('UNSURE')} />
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
  stage: {
    flex: 1,
    gap: 6,
    paddingHorizontal: 8,
    minHeight: 200,
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
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
});
