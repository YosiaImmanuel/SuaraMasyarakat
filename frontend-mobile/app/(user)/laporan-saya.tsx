import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { Laporan } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import LaporanCard from '@/src/components/ui/LaporanCard';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';
import { useAuth } from '@/src/lib/auth-context';

const statusFilters = [
  { label: 'Semua', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' },
];

export default function LaporanSayaScreen() {
  const { user } = useAuth();
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchLaporan = useCallback(async () => {
    try {
      const data = await apiFetch<Laporan[]>(ENDPOINTS.LAPORAN.LIST);
      const allLaporan = Array.isArray(data) ? data : [];
      const myLaporan = allLaporan.filter((l) => l.user_id === user?.id);

      let filtered = myLaporan;
      if (statusFilter) {
        filtered = filtered.filter((l) => l.status === statusFilter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (l) => l.judul.toLowerCase().includes(q) || l.deskripsi.toLowerCase().includes(q)
        );
      }

      setLaporan(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, user]);

  useFocusEffect(
    useCallback(() => {
      fetchLaporan();
    }, [fetchLaporan])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLaporan();
    setRefreshing(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Hapus Laporan', 'Yakin ingin menghapus laporan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await apiFetch(ENDPOINTS.LAPORAN.DELETE(id), { method: 'DELETE' });
            setLaporan((prev) => prev.filter((l) => l.id !== id));
          } catch (err: any) {
            Alert.alert('Gagal', err.message);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Laporan Saya</Text>
            <Text style={styles.headerSubtitle}>Riwayat laporan yang Anda buat</Text>
          </View>
          <TouchableOpacity
            style={styles.buatBtn}
            onPress={() => router.push('/(user)/buat-laporan')}
            activeOpacity={0.8}
          >
            <Text style={styles.buatBtnText}>+ Buat Laporan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari laporan..."
            placeholderTextColor={Colors.light.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              style={styles.searchClear}
              onPress={() => setSearch('')}
              activeOpacity={0.7}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList} contentContainerStyle={styles.categoryListContent}>
          {statusFilters.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
              onPress={() => setStatusFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === f.value && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {laporan.length === 0 ? (
            <EmptyState title="Tidak ada laporan" message="Anda belum membuat laporan" />
          ) : (
            laporan.map((item) => (
              <View key={item.id}>
                <LaporanCard laporan={item} />
                {deletingId === item.id && (
                  <ActivityIndicator size="small" color={Colors.light.destructive} />
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  buatBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  buatBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
  },
  searchClear: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  searchClearText: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoryList: {
    flexDirection: 'row',
  },
  categoryListContent: {
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    paddingBottom: Spacing['3xl'],
  },
});
