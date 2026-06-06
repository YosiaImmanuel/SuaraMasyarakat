import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { fetchLaporan } from "@/lib/api";
import { Laporan } from "@/lib/types";

const statusColors: Record<string, string> = { pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444" };
const statusLabels: Record<string, string> = { pending: "Pending", approved: "Disetujui", rejected: "Ditolak" };

function parseGambar(gambar: string | null | undefined): string[] {
  if (!gambar) return [];
  try { const parsed = JSON.parse(gambar); return Array.isArray(parsed) ? parsed : [String(parsed)]; } catch { return [gambar]; }
}

export default function UserDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [allLaporan, setAllLaporan] = useState<Laporan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchLaporan();
      setAllLaporan(data || []);
    } catch {
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const myLaporan = allLaporan.filter((l) => l.user_id === user?.id);
  const feedLaporan = allLaporan.filter(
    (l) => l.user_id !== user?.id && (l.status === "pending" || l.status === "approved")
  ).slice(0, 6);

  const total = myLaporan.length;
  const pending = myLaporan.filter((l) => l.status === "pending").length;
  const approved = myLaporan.filter((l) => l.status === "approved").length;
  const rejected = myLaporan.filter((l) => l.status === "rejected").length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.greeting}>Halo, {user?.nama || "Pengguna"}</Text>
        <Text style={styles.subtitle}>Selamat datang di SuaraMasyarakat</Text>

        <View style={styles.statsGrid}>
          <StatCard icon="document-text" label="Total" value={total} color="#2563eb" />
          <StatCard icon="time" label="Pending" value={pending} color="#f59e0b" />
          <StatCard icon="checkmark-circle" label="Disetujui" value={approved} color="#10b981" />
          <StatCard icon="close-circle" label="Ditolak" value={rejected} color="#ef4444" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Laporan Warga Lain</Text>
          <TouchableOpacity onPress={() => router.push("/(user)/feed" as any)}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
        ) : feedLaporan.length === 0 ? (
          <View style={styles.empty}><Ionicons name="newspaper-outline" size={48} color="#cbd5e1" /><Text style={styles.emptyText}>Belum ada laporan dari warga lain</Text></View>
        ) : (
          <View style={styles.feedGrid}>
            {feedLaporan.map((item) => {
              const images = parseGambar(item.gambar);
              const thumbnail = images.length > 0 ? images[0] : null;
              return (
                <TouchableOpacity key={item.id} style={styles.feedCard} onPress={() => router.push(`/(user)/laporan/${item.id}` as any)} activeOpacity={0.7}>
                  {thumbnail ? (
                    <Image source={{ uri: thumbnail }} style={styles.feedThumb} />
                  ) : (
                    <View style={[styles.feedThumb, styles.feedThumbPlaceholder]}>
                      <Ionicons name="document-text" size={24} color="#cbd5e1" />
                    </View>
                  )}
                  <View style={styles.feedContent}>
                    <Text style={styles.feedTitle} numberOfLines={1}>{item.judul}</Text>
                    <Text style={styles.feedDesc} numberOfLines={2}>{item.deskripsi}</Text>
                    <View style={styles.feedMeta}>
                      <Text style={styles.feedDate}>{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</Text>
                      <Text style={styles.feedCategory}>{item.kategori || "Umum"}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.fab} onPress={() => router.push("/(user)/laporan/create" as any)} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="#fff" />
          <Text style={styles.fabText}>Buat Laporan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  scroll: { padding: 20, paddingBottom: 100 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: "700", marginTop: 4 },
  statLabel: { fontSize: 12, fontWeight: "500", color: "#94a3b8", marginTop: 2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  seeAll: { fontSize: 13, color: "#2563eb", fontWeight: "500" },
  feedGrid: { gap: 12 },
  feedCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  feedThumb: { width: 100, height: 100, backgroundColor: "#f1f5f9" },
  feedThumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  feedContent: { flex: 1, padding: 12, justifyContent: "space-between" },
  feedTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 4 },
  feedDesc: { fontSize: 12, color: "#6b7280", lineHeight: 16, marginBottom: 8 },
  feedMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feedDate: { fontSize: 11, color: "#94a3b8" },
  feedCategory: { fontSize: 10, color: "#6b7280", backgroundColor: "#f1f5f9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
  fab: {
    position: "absolute", bottom: 20, right: 20, backgroundColor: "#2563eb",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 28, shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "600", fontSize: 14, marginLeft: 8 },
});
