import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchLaporan, deleteLaporan, fetchCategories } from "@/lib/api";

const statusColors: Record<string, string> = { pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444" };
const statusLabels: Record<string, string> = { pending: "Pending", approved: "Disetujui", rejected: "Ditolak" };
const statusFilters = [
  { value: "all", label: "Semua" }, { value: "pending", label: "Pending" },
  { value: "approved", label: "Disetujui" }, { value: "rejected", label: "Ditolak" },
];

export default function AdminLaporanListScreen() {
  const router = useRouter();
  const [laporan, setLaporan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const data = await fetchLaporan();
      setLaporan(data || []);
    } catch {
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (id: number, judul: string) => {
    Alert.alert("Hapus Laporan", `Yakin ingin menghapus laporan "${judul}"?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        try {
          const { res } = await deleteLaporan(id);
          if (res.ok) setLaporan((prev) => prev.filter((l) => l.id !== id));
          else Alert.alert("Error", "Gagal menghapus laporan.");
        } catch { Alert.alert("Error", "Terjadi kesalahan."); }
      }},
    ]);
  };

  const filtered = laporan.filter((l: any) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search && !l.judul.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(admin)/laporan/${item.id}` as any)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.judul}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] + "20" }]}>
          <Text style={[styles.badgeText, { color: statusColors[item.status] }]}>{statusLabels[item.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardCategory}>{item.kategori || "Umum"}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.deskripsi}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.judul)}><Ionicons name="trash-outline" size={18} color="#ef4444" /></TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kelola Laporan</Text>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Cari laporan..." placeholderTextColor="#94a3b8" />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
      </View>
      <View style={styles.filterRow}>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={statusFilters} keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.filterChip, statusFilter === item.value && styles.filterChipActive]} onPress={() => setStatusFilter(item.value)}>
              <Text style={[styles.filterChipText, statusFilter === item.value && styles.filterChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      {isLoading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      : <FlatList data={filtered} keyExtractor={(item) => String(item.id)} renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="document-text-outline" size={48} color="#cbd5e1" /><Text style={styles.emptyText}>Tidak ada laporan ditemukan</Text></View>}
        />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, height: 42, borderWidth: 1, borderColor: "#e2e8f0" },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  filterRow: { marginBottom: 8 },
  filterList: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  filterChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterChipText: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  filterChipTextActive: { color: "#fff" },
  list: { padding: 20, paddingTop: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  cardCategory: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "#4b5563", marginBottom: 4, lineHeight: 18 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  cardDate: { fontSize: 11, color: "#94a3b8" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
});
