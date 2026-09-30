import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { BurstLoupeFrame } from '@/services/burstLoupe';

type Props = {
  visible: boolean;
  frames: BurstLoupeFrame[];
  initialIndex: number;
  onClose: () => void;
  onZoomUsed?: () => void;
};

function BurstLoupeBody({
  frames,
  initialIndex,
  onClose,
  onZoomUsed,
}: Omit<Props, 'visible'>) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<BurstLoupeFrame>>(null);
  const [pageIndex, setPageIndex] = useState(initialIndex);
  const pageHeight = height * 0.78;
  const openPage = initialIndex >= 0 && initialIndex < frames.length ? initialIndex : 0;
  const active = frames[pageIndex] ?? frames[openPage];

  const onHorizontalScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setPageIndex(next);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Burst loupe</Text>
        <Text style={styles.subtitle}>
          {active
            ? `Shot ${active.burstIndex + 1} of ${frames.length}${active.isCurrent ? ' · current task' : ''}`
            : ''}
        </Text>
        <Text style={styles.hint}>Swipe ◄ ► between frames · pinch or scroll to zoom</Text>
      </View>

      <FlatList
        ref={listRef}
        data={frames}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={frames.length > 0 ? openPage : undefined}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={onHorizontalScrollEnd}
        onScrollToIndexFailed={() => {
          listRef.current?.scrollToOffset({ offset: openPage * width, animated: false });
        }}
        renderItem={({ item }) => (
          <View style={{ width, height: pageHeight }}>
            <ScrollView
              style={styles.zoomScroll}
              contentContainerStyle={styles.zoomContent}
              minimumZoomScale={1}
              maximumZoomScale={4}
              centerContent
              onScrollBeginDrag={() => onZoomUsed?.()}
            >
              <Image
                source={{ uri: item.previewUri }}
                style={{ width: width - 24, height: pageHeight - 24 }}
                contentFit="contain"
                transition={150}
              />
            </ScrollView>
          </View>
        )}
        keyExtractor={(item) => item.taskId}
      />

      <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
        <Text style={styles.closeText}>Close loupe</Text>
      </Pressable>
    </View>
  );
}

export function BurstLoupeModal({ visible, frames, initialIndex, onClose, onZoomUsed }: Props) {
  if (!visible || frames.length === 0) {
    return null;
  }

  const mountKey = frames.map((frame) => frame.taskId).join('|');

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <BurstLoupeBody
        key={`${mountKey}-${initialIndex}`}
        frames={frames}
        initialIndex={initialIndex}
        onClose={onClose}
        onZoomUsed={onZoomUsed}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0F14',
    paddingTop: 48,
  },
  header: {
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 8,
  },
  title: {
    color: '#E8EEF5',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#58A6FF',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: '#7E92A8',
    fontSize: 12,
  },
  zoomScroll: {
    flex: 1,
  },
  zoomContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 8,
    backgroundColor: '#243040',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeText: {
    color: '#E8EEF5',
    fontWeight: '700',
    fontSize: 15,
  },
});
