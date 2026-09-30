import { Image } from 'expo-image';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { BurstLoupeFrame } from '@/services/burstLoupe';

type Props = {
  frames: BurstLoupeFrame[];
  onSelect: (index: number) => void;
};

const THUMB_SIZE = 56;

export function BurstThumbnailStrip({ frames, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Burst frames</Text>
      <FlatList
        data={frames}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyExtractor={(item) => item.taskId}
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Burst frame ${item.burstIndex + 1}`}
            onPress={() => onSelect(index)}
            style={[styles.thumb, item.isCurrent && styles.thumbCurrent]}
          >
            <Image source={{ uri: item.previewUri }} style={styles.image} contentFit="cover" />
            <Text style={[styles.badge, item.isCurrent && styles.badgeCurrent]}>
              {item.burstIndex + 1}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    color: '#7E92A8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
  list: {
    paddingHorizontal: 12,
    gap: 8,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#243040',
  },
  thumbCurrent: {
    borderColor: '#58A6FF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: '#E8EEF5',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  badgeCurrent: {
    backgroundColor: '#58A6FF',
    color: '#0B0F14',
  },
});
