import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import type { BoundingBox } from '@/types/labeling';

type Props = {
  uri: string;
  allowZoom?: boolean;
  onZoomUsed?: () => void;
  /** Normalized detector box drawn over the inline preview (best-effort with letterboxing). */
  detectorBox?: BoundingBox;
};

function DetectorBoxOverlay({ box }: { box: BoundingBox }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.detectorBox,
        {
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.width * 100}%`,
          height: `${box.height * 100}%`,
        },
      ]}
    />
  );
}

export function ZoomablePreview({ uri, allowZoom = true, onZoomUsed, detectorBox }: Props) {
  const { width, height } = useWindowDimensions();
  const [zoomOpen, setZoomOpen] = useState(false);

  const openZoom = () => {
    if (!allowZoom) {
      return;
    }
    onZoomUsed?.();
    setZoomOpen(true);
  };

  return (
    <>
      <Pressable style={styles.frame} onPress={openZoom} accessibilityRole="imagebutton">
        <Image source={{ uri }} style={styles.image} contentFit="contain" transition={200} />
        {detectorBox ? <DetectorBoxOverlay box={detectorBox} /> : null}
        {allowZoom ? <Text style={styles.hint}>Tap to zoom</Text> : null}
      </Pressable>

      <Modal visible={zoomOpen} animationType="fade" onRequestClose={() => setZoomOpen(false)}>
        <View style={styles.modalRoot}>
          <ScrollView
            minimumZoomScale={1}
            maximumZoomScale={4}
            centerContent
            contentContainerStyle={{ minHeight: height, minWidth: width }}
          >
            <View style={{ width, height: height * 0.85 }}>
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
              {detectorBox ? (
                <DetectorBoxOverlay box={detectorBox} />
              ) : null}
            </View>
          </ScrollView>
          <Pressable style={styles.close} onPress={() => setZoomOpen(false)}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  detectorBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#E36B24',
    borderRadius: 2,
  },
  frame: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111820',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hint: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    color: '#9FB0C3',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  close: {
    position: 'absolute',
    top: 52,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
});
