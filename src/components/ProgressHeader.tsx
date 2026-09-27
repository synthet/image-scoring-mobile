import { StyleSheet, Text, View } from 'react-native';

type Props = {
  completed: number;
  total: number;
  pendingSync?: number;
};

export function ProgressHeader({ completed, total, pendingSync = 0 }: Props) {
  const ratio = total > 0 ? completed / total : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>
          {completed} / {total} labeled
        </Text>
        {pendingSync > 0 ? (
          <Text style={styles.sync}>{pendingSync} pending sync</Text>
        ) : (
          <Text style={styles.syncOk}>Synced</Text>
        )}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#E8EEF5',
    fontSize: 14,
    fontWeight: '600',
  },
  sync: {
    color: '#F5C542',
    fontSize: 12,
  },
  syncOk: {
    color: '#6BCB8E',
    fontSize: 12,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#1E2833',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#4DA3FF',
    borderRadius: 999,
  },
});
