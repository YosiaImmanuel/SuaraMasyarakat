import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { LaporanStatus } from '@/src/types';

const statusConfig: Record<LaporanStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: {
    label: 'Pending',
    bg: '#fffbeb',
    text: '#d97706',
    dot: '#f59e0b',
  },
  approved: {
    label: 'Disetujui',
    bg: '#ecfdf5',
    text: '#059669',
    dot: '#10b981',
  },
  rejected: {
    label: 'Ditolak',
    bg: '#fef2f2',
    text: '#dc2626',
    dot: '#ef4444',
  },
};

interface Props {
  status: LaporanStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const config = statusConfig[status];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: config.dot }, isSmall && styles.dotSm]} />
      <Text style={[styles.label, { color: config.text }, isSmall && styles.labelSm]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSm: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
});
