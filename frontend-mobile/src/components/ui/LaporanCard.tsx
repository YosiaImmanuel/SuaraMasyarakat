import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Laporan } from '@/src/types';
import StatusBadge from './StatusBadge';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';

interface Props {
  laporan: Laporan;
  showActions?: boolean;
}

export default function LaporanCard({ laporan, showActions }: Props) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/laporan/${laporan.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>
            {laporan.judul}
          </Text>
          <Text style={styles.category}>{laporan.kategori}</Text>
        </View>
        <StatusBadge status={laporan.status} size="sm" />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {laporan.deskripsi}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{formatDate(laporan.created_at)}</Text>
        {laporan.nama_pelapor && (
          <Text style={styles.footerText}>oleh {laporan.nama_pelapor}</Text>
        )}
        {laporan.lokasi && (
          <Text style={styles.location} numberOfLines={1}>
            📍 {laporan.lokasi}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  location: {
    fontSize: 12,
    color: Colors.light.textMuted,
    flex: 1,
  },
});
