import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { Laporan, Category } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = Spacing.md;
const HORIZONTAL_PADDING = Spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

function parseGambar(gambar: string | null | undefined): string[] {
  if (!gambar) return [];
  try {
    const parsed = JSON.parse(gambar);
    if (Array.isArray(parsed)) return parsed;
    return [String(parsed)];
  } catch {
    return [gambar];
  }
}

export default function FeedScreen() {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLaporan = useCallback(async () => {
    try {
      const params: Record<string, string | number | undefined> = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const data = await apiFetch<Laporan[]>(ENDPOINTS.LAPORAN.LIST, { params });
      setLaporan(Array.isArray(data) ? data.filter((l) => l.status !== 'rejected') : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useFocusEffect(
    useCallback(() => {
      fetchLaporan();
    }, [fetchLaporan])
  );

  useEffect(() => {
    apiFetch<Category[]>(ENDPOINTS.CATEGORIES.LIST).then((data) => {
      setCategories(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLaporan();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Feed Laporan</Text>
            <Text style={styles.headerSubtitle}>Semua laporan yang telah dibuat oleh warga</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari judul laporan..."
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>
            Semua
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === cat.id && styles.filterChipTextActive,
              ]}
            >
              {cat.nama}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {laporan.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                title={search ? `Tidak ada laporan dengan judul "${search}"` : 'Tidak ada laporan'}
                message={search || selectedCategory ? 'Coba ubah filter atau kata kunci pencarian' : 'Belum ada laporan yang dipublikasikan'}
              />
              {(search || selectedCategory) && (
                <TouchableOpacity
                  onPress={() => { setSearch(''); setSelectedCategory(null); }}
                  style={styles.resetBtn}
                >
                  <Text style={styles.resetBtnText}>Reset filter</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.grid}>
              {laporan.map((item) => {
                const images = parseGambar(item.gambar);
                const thumbnail = images.length > 0 ? images[0] : null;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={() => router.push(`/laporan/${item.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardThumb}>
                      {thumbnail ? (
                        <Image
                          source={{ uri: thumbnail }}
                          style={styles.cardImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.cardThumbPlaceholder}>📄</Text>
                      )}
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.judul}
                      </Text>
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {item.deskripsi}
                      </Text>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardDate}>
                          {formatDate(item.created_at)}
                        </Text>
                        <View style={styles.cardCat}>
                          <Text style={styles.cardCatText} numberOfLines={1}>
                            {item.kategori}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchRow: {
    position: 'relative',
    flexDirection: 'row',
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
    zIndex: 1,
  },
  searchClearText: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  filterRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 40,
  },
  resetBtn: {
    marginTop: Spacing.md,
  },
  resetBtnText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  cardThumb: {
    width: '100%',
    height: CARD_WIDTH * 0.56,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  cardThumbPlaceholder: {
    fontSize: 28,
  },
  cardBody: {
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  cardCat: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    maxWidth: 100,
  },
  cardCatText: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
});
