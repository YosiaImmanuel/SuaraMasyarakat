import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useAuth } from '@/src/lib/auth-context';
import { apiFetch } from '@/src/lib/api';
import { Laporan, DashboardStats, User } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import StatCard from '@/src/components/ui/StatCard';
import LaporanCard from '@/src/components/ui/LaporanCard';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';

export default function SuperAdminDashboardScreen() {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLaporan, setRecentLaporan] = useState<Laporan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [laporanData, usersData] = await Promise.all([
        apiFetch<Laporan[]>(ENDPOINTS.LAPORAN.LIST),
        apiFetch<User[]>(ENDPOINTS.USERS.LIST),
      ]);
      const laporanList = Array.isArray(laporanData) ? laporanData : [];
      const usersList = Array.isArray(usersData) ? usersData : [];

      setRecentLaporan(laporanList.slice(0, 5));
      setStats({
        total: laporanList.length,
        pending: laporanList.filter((l: Laporan) => l.status === 'pending').length,
        approved: laporanList.filter((l: Laporan) => l.status === 'approved').length,
        rejected: laporanList.filter((l: Laporan) => l.status === 'rejected').length,
        total_users: usersList.length,
        total_admins: usersList.filter((u: User) => u.role === 'admin' || u.role === 'super_admin').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (loading) return <Loading fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerGradient}>
        <Text style={styles.greeting}>
          Halo, {user?.nama?.split(' ')[0] || 'Super Admin'}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Super Admin</Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard label="Total Laporan" value={stats.total} color={Colors.light.primary} />
          <StatCard label="Pending" value={stats.pending} color={Colors.light.pending} />
          <StatCard label="Disetujui" value={stats.approved} color={Colors.light.approved} />
          <StatCard label="Ditolak" value={stats.rejected} color={Colors.light.rejected} />
          {stats.total_users !== undefined && (
            <StatCard label="Total Users" value={stats.total_users} color="#8b5cf6" />
          )}
          {stats.total_admins !== undefined && (
            <StatCard label="Admin" value={stats.total_admins} color="#f59e0b" />
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Laporan Terbaru</Text>
      </View>

      {recentLaporan.length === 0 ? (
        <EmptyState title="Belum ada laporan" message="Belum ada laporan yang dibuat" />
      ) : (
        recentLaporan.map((item) => (
          <LaporanCard key={item.id} laporan={item} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingBottom: Spacing['3xl'],
  },
  headerGradient: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing['2xl'],
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    padding: Spacing.lg,
    marginTop: -24,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
});
