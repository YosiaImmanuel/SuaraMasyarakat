import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { fetchLaporan, updateLaporanStatus } from "@/lib/api";

const statusColors: Record<string, string> = { pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444" };
const statusLabels: Record<string, string> = { pending: "Pending", approved: "Disetujui", rejected: "Ditolak" };

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [laporan, setLaporan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await fetchLaporan();
      setLaporan(data || []);
    } catch {
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleStatus = async (id: number, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      const { res } = await updateLaporanStatus(id, status);
      if (res.ok) await load();
      else Alert.alert("Error", "Gagal memperbarui status.");
    } catch { Alert.alert("Error", "Terjadi kesalahan."); }
    finally { setActionLoading(null); }
  };

  const total = laporan.length;
  const pending = laporan.filter((l: any) => l.status === "pending").length;
  const approved = laporan.filter((l: any) => l.status === "approved").length;
  const rejected = laporan.filter((l: any) => l.status === "rejected").length;

  const todayCount = laporan.filter((l: any) =>
    l.created_at && new Date(l.created_at).toDateString() === new Date().toDateString()
  ).length;

  const pendingList = laporan
    .filter((l: any) => l.status === "pending")
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.greeting}>Halo, {user?.nama || "Admin"}</Text>
        <Text style={styles.subtitle}>Panel Admin SuaraMasyarakat</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabelTotal}>Total</Text>
            <Text style={styles.statValueTotal}>{total}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badgeSm, { backgroundColor: "#f59e0b20" }]}><Text style={[styles.badgeSmText, { color: "#f59e0b" }]}>{pending} pending</Text></View>
              <View style={[styles.badgeSm, { backgroundColor: "#10b98120" }]}><Text style={[styles.badgeSmText, { color: "#10b981" }]}>{approved} approved</Text></View>
              <View style={[styles.badgeSm, { backgroundColor: "#ef444420" }]}><Text style={[styles.badgeSmText, { color: "#ef4444" }]}>{rejected} rejected</Text></View>
            </View>
            <View style={styles.divider} />
            <View style={styles.todayRow}>
              <View>
                <Text style={styles.statLabel}>Hari ini</Text>
                <Text style={styles.statValue}>{todayCount}</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Perlu review</Text>
                <Text style={[styles.statValue, { color: "#f59e0b" }]}>{pending}</Text>
              </View>
            </View>
          </View>
        </View>

        {pendingList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Antrian Review</Text>
              <TouchableOpacity onPress={() => router.push("/(admin)/laporan" as any)}>
                <Text style={styles.seeAll}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            {pendingList.map((item: any) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.reviewInfo}>
                  <TouchableOpacity onPress={() => router.push(`/(admin)/laporan/${item.id}` as any)}>
                    <Text style={styles.reviewTitle} numberOfLines={1}>{item.judul || `Laporan #${item.id}`}</Text>
                    <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleStatus(item.id, "approved")}
                    disabled={actionLoading === item.id}
                  >
                    {actionLoading === item.id ? <ActivityIndicator size="small" color="#10b981" /> : <><Ionicons name="checkmark-circle" size={16} color="#10b981" /><Text style={styles.approveBtnText}>Setujui</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleStatus(item.id, "rejected")}
                    disabled={actionLoading === item.id}
                  >
                    {actionLoading === item.id ? <ActivityIndicator size="small" color="#ef4444" /> : <><Ionicons name="close-circle" size={16} color="#ef4444" /><Text style={styles.rejectBtnText}>Tolak</Text></>}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  statsRow: { marginBottom: 24 },
  statCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statLabelTotal: { fontSize: 12, color: "#94a3b8", fontWeight: "500", textTransform: "uppercase", letterSpacing: 1 },
  statValueTotal: { fontSize: 48, fontWeight: "700", color: "#111827", marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeSmText: { fontSize: 11, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 16 },
  todayRow: { flexDirection: "row", gap: 32 },
  statLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111827", marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  seeAll: { fontSize: 13, color: "#2563eb", fontWeight: "500" },
  reviewCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  reviewInfo: { marginBottom: 10 },
  reviewTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  reviewDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  reviewActions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 8, gap: 4 },
  approveBtn: { backgroundColor: "#10b98115" },
  rejectBtn: { backgroundColor: "#ef444415" },
  approveBtnText: { fontSize: 12, fontWeight: "600", color: "#10b981" },
  rejectBtnText: { fontSize: 12, fontWeight: "600", color: "#ef4444" },
});
