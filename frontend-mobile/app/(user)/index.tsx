import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/lib/auth-context';
import { apiFetch } from '@/src/lib/api';
import { Laporan } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import Loading from '@/src/components/ui/Loading';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) * 0.75;

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

function ProgressBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    widthAnim.setValue(0);
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 700,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [pct, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={pStyles.row}>
      <View style={pStyles.labelRow}>
        <Text style={pStyles.label}>{label}</Text>
        <Text style={pStyles.pct}>{pct}%</Text>
      </View>
      <View style={pStyles.track}>
        <Animated.View style={[pStyles.bar, { backgroundColor: color, width: animatedWidth }]} />
      </View>
    </View>
  );
}

const pStyles = StyleSheet.create({
  row: { marginBottom: 14 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  label: { fontSize: 14, color: Colors.light.textSecondary },
  pct: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  track: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 3 },
});

export default function UserDashboardScreen() {
  const { user } = useAuth();
  const [myLaporan, setMyLaporan] = useState<Laporan[]>([]);
  const [feedLaporan, setFeedLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiFetch<Laporan[]>(ENDPOINTS.LAPORAN.LIST);
      const laporanList = Array.isArray(data) ? data : [];

      const myData = laporanList.filter((l: Laporan) => l.user_id === user?.id);
      setMyLaporan(myData);

      const feedData = laporanList.filter(
        (l: Laporan) => l.status === 'pending' || l.status === 'approved'
      );
      setFeedLaporan(feedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const total = myLaporan.length;
  const pending = myLaporan.filter((l) => l.status === 'pending').length;
  const approved = myLaporan.filter((l) => l.status === 'approved').length;
  const rejected = myLaporan.filter((l) => l.status === 'rejected').length;
  const pctApproved = total ? Math.round((approved / total) * 100) : 0;
  const pctPending = total ? Math.round((pending / total) * 100) : 0;
  const pctRejected = total ? Math.round((rejected / total) * 100) : 0;

  if (loading) return <Loading fullScreen />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={s.headerTextWrap}>
            <Text style={s.headerTitle}>Dashboard</Text>
            <Text style={s.headerSubtitle}>Overview laporan Anda</Text>
          </View>
          <TouchableOpacity
            style={s.buatBtn}
            onPress={() => router.push('/(user)/buat-laporan')}
            activeOpacity={0.8}
          >
            <Text style={s.buatBtnText}>+ Buat Laporan</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

      <View style={s.card}>
        <Text style={s.cardLabel}>LAPORAN SAYA</Text>
        <Text style={s.cardValue}>{total}</Text>
        <View style={s.badgeRow}>
          <View style={[s.badge, { backgroundColor: Colors.light.pendingBg }]}>
            <View style={[s.dot, { backgroundColor: Colors.light.pending }]} />
            <Text style={[s.badgeText, { color: '#d97706' }]}>{pending} pending</Text>
          </View>
          <View style={[s.badge, { backgroundColor: Colors.light.approvedBg }]}>
            <View style={[s.dot, { backgroundColor: Colors.light.approved }]} />
            <Text style={[s.badgeText, { color: '#059669' }]}>{approved} approved</Text>
          </View>
          <View style={[s.badge, { backgroundColor: Colors.light.rejectedBg }]}>
            <View style={[s.dot, { backgroundColor: Colors.light.rejected }]} />
            <Text style={[s.badgeText, { color: '#dc2626' }]}>{rejected} rejected</Text>
          </View>
        </View>
        <View style={s.divider} />
        <View style={s.bottomRow}>
          <View>
            <Text style={s.bottomLabel}>Disetujui</Text>
            <Text style={[s.bottomValue, { color: Colors.light.approved }]}>{approved}</Text>
          </View>
          <View>
            <Text style={s.bottomLabel}>Ditolak</Text>
            <Text style={[s.bottomValue, { color: Colors.light.rejected }]}>{rejected}</Text>
          </View>
          {myLaporan.length > 0 && (
            <View style={s.lastSubmit}>
              <Text style={s.bottomLabel}>Terakhir dikirim</Text>
              <Text style={s.lastSubmitDate}>
                {new Date(myLaporan[0].created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardLabel}>DISTRIBUSI STATUS</Text>
        {total === 0 ? (
          <View style={s.emptyDist}>
            <Text style={s.emptyIcon}>📄</Text>
            <Text style={s.emptyText}>
              Belum ada laporan.{'\n'}Buat laporan pertama kamu!
            </Text>
            <TouchableOpacity
              style={s.buatSmallBtn}
              onPress={() => router.push('/(user)/buat-laporan')}
              activeOpacity={0.8}
            >
              <Text style={s.buatSmallBtnText}>+ Buat Laporan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.progressWrap}>
            <ProgressBar label="Approved" pct={pctApproved} color={Colors.light.approved} />
            <ProgressBar label="Pending" pct={pctPending} color={Colors.light.pending} />
            <ProgressBar label="Rejected" pct={pctRejected} color={Colors.light.rejected} />
            <View style={s.divider} />
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total keseluruhan</Text>
              <Text style={s.totalValue}>{total}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={s.feedSection}>
        <View style={s.feedHeader}>
          <View style={s.feedHeaderLeft}>
            <Text style={s.feedTitle}>Semua Laporan Warga</Text>
            <Text style={s.feedSubtitle}>Laporan yang dikirim oleh warga</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(user)/feed')} activeOpacity={0.7}>
            <Text style={s.lihatSemua}>Lihat semua →</Text>
          </TouchableOpacity>
        </View>

        {feedLaporan.length === 0 ? (
          <View style={s.feedEmpty}>
            <View style={s.feedEmptyIcon}>
              <Text style={s.feedEmptyIconText}>📄</Text>
            </View>
            <Text style={s.feedEmptyTitle}>Feed masih kosong</Text>
            <Text style={s.feedEmptyDesc}>Belum ada laporan dari warga lain yang tersedia.</Text>
          </View>
        ) : (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.feedScroll}
            >
              {feedLaporan.slice(0, 3).map((laporan) => {
                const images = parseGambar(laporan.gambar);
                const thumbnail = images.length > 0 ? images[0] : null;
                return (
                  <TouchableOpacity
                    key={laporan.id}
                    style={s.feedCard}
                    onPress={() => router.push(`/laporan/${laporan.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={s.feedThumb}>
                      {thumbnail ? (
                        <Image source={{ uri: thumbnail }} style={s.feedImg} resizeMode="cover" />
                      ) : (
                        <Text style={s.feedThumbPlaceholder}>📄</Text>
                      )}
                    </View>
                    <View style={s.feedBody}>
                      <Text style={s.feedCardTitle} numberOfLines={1}>{laporan.judul}</Text>
                      <Text style={s.feedCardDesc} numberOfLines={2}>{laporan.deskripsi}</Text>
                      <View style={s.feedCardFooter}>
                        <Text style={s.feedCardDate}>
                          {new Date(laporan.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                        <View style={s.feedCat}>
                          <Text style={s.feedCatText}>{laporan.kategori}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {feedLaporan.length > 3 && (
              <TouchableOpacity
                style={s.lihatLainnya}
                onPress={() => router.push('/(user)/feed')}
                activeOpacity={0.7}
              >
                <Text style={s.lihatLainnyaText}>
                  Lihat {feedLaporan.length - 3} laporan lainnya →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: Spacing['3xl'] },

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

  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  cardLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  cardValue: {
    fontSize: 52,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  divider: { height: 1, backgroundColor: Colors.light.borderLight, marginBottom: Spacing.lg },

  bottomRow: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'flex-end',
  },
  bottomLabel: { fontSize: 11, color: Colors.light.textMuted, marginBottom: 2 },
  bottomValue: { fontSize: 22, fontWeight: '700' },
  lastSubmit: { marginLeft: 'auto', alignItems: 'flex-end' },
  lastSubmitDate: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '500' },

  emptyDist: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 14, color: Colors.light.textMuted, textAlign: 'center', lineHeight: 20 },
  buatSmallBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  buatSmallBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  progressWrap: { paddingTop: Spacing.xs },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: { fontSize: 12, color: Colors.light.textMuted },
  totalValue: { fontSize: 22, fontWeight: '700', color: Colors.light.text },

  feedSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  feedHeaderLeft: { flex: 1, marginRight: Spacing.sm },
  feedTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  feedSubtitle: { fontSize: 12, color: Colors.light.textMuted, marginTop: 2 },
  lihatSemua: { fontSize: 12, color: Colors.light.primary, fontWeight: '600' },

  feedEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: Spacing.sm,
  },
  feedEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  feedEmptyIconText: { fontSize: 22 },
  feedEmptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary },
  feedEmptyDesc: { fontSize: 13, color: Colors.light.textMuted, textAlign: 'center' },

  feedScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  feedCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  feedThumb: {
    width: '100%',
    height: CARD_WIDTH * 0.56,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedImg: { width: '100%', height: '100%' },
  feedThumbPlaceholder: { fontSize: 28 },
  feedBody: { padding: Spacing.md },
  feedCardTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  feedCardDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  feedCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedCardDate: { fontSize: 11, color: Colors.light.textMuted },
  feedCat: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  feedCatText: { fontSize: 11, color: Colors.light.textMuted, fontWeight: '500' },

  lihatLainnya: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  lihatLainnyaText: { fontSize: 12, color: Colors.light.primary, fontWeight: '600' },
});
