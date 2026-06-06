import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { fetchLaporan, fetchCategories, fetchUsers } from "@/lib/api";

export default function SuperAdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [laporan, setLaporan] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [l, c, u] = await Promise.all([
        fetchLaporan(), fetchCategories(), fetchUsers(),
      ]);
      setLaporan(l || []);
      setCategories(c || []);
      setUsers(u || []);
    } catch {
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const userRoleCounts = {
    user: users.filter((u: any) => u.role === "user").length,
    admin: users.filter((u: any) => u.role === "admin").length,
    super_admin: users.filter((u: any) => u.role === "super_admin").length,
  };

  const stats = {
    totalLaporan: laporan.length,
    pending: laporan.filter((l: any) => l.status === "pending").length,
    approved: laporan.filter((l: any) => l.status === "approved").length,
    rejected: laporan.filter((l: any) => l.status === "rejected").length,
    totalUsers: users.length,
    totalCategories: categories.length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.greeting}>Halo, {user?.nama || "Super Admin"}</Text>
        <Text style={styles.subtitle}>Panel Super Admin SuaraMasyarakat</Text>

        <View style={styles.statsGrid}>
          <StatCard icon="document-text" label="Total Laporan" value={stats.totalLaporan} color="#2563eb" />
          <StatCard icon="time" label="Pending" value={stats.pending} color="#f59e0b" />
          <StatCard icon="checkmark-circle" label="Disetujui" value={stats.approved} color="#10b981" />
          <StatCard icon="close-circle" label="Ditolak" value={stats.rejected} color="#ef4444" />
          <StatCard icon="people" label="Total Pengguna" value={stats.totalUsers} color="#8b5cf6" />
          <StatCard icon="pricetags" label="Kategori" value={stats.totalCategories} color="#06b6d4" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pengguna Berdasarkan Role</Text>
        </View>
        <View style={styles.roleRow}>
          <RoleBadge label="User" value={userRoleCounts.user} color="#2563eb" />
          <RoleBadge label="Admin" value={userRoleCounts.admin} color="#f59e0b" />
          <RoleBadge label="Super Admin" value={userRoleCounts.super_admin} color="#ef4444" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Akses Cepat</Text>
        </View>
        <View style={styles.quickGrid}>
          <QuickCard icon="people" label="Kelola Pengguna" onPress={() => router.push("/(superadmin)/users" as any)} color="#8b5cf6" />
          <QuickCard icon="document-text" label="Kelola Laporan" onPress={() => router.push("/(superadmin)/laporan" as any)} color="#2563eb" />
          <QuickCard icon="pricetags" label="Kelola Kategori" onPress={() => router.push("/(superadmin)/kategori" as any)} color="#06b6d4" />
          <QuickCard icon="chatbubble-ellipses" label="Pesan" onPress={() => router.push("/(superadmin)/chat" as any)} color="#10b981" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RoleBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.roleBadge, { borderColor: color }]}>
      <Text style={[styles.roleBadgeValue, { color }]}>{value}</Text>
      <Text style={styles.roleBadgeLabel}>{label}</Text>
    </View>
  );
}

function QuickCard({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 14, borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 26, fontWeight: "700", marginTop: 2 },
  statLabel: { fontSize: 11, fontWeight: "500", color: "#94a3b8", marginTop: 2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  roleBadge: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  roleBadgeValue: { fontSize: 24, fontWeight: "700" },
  roleBadgeLabel: { fontSize: 11, fontWeight: "500", color: "#6b7280", marginTop: 2 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: "500", color: "#374151" },
});
