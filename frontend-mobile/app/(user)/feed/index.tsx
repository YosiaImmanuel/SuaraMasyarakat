import { useEffect, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Image, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchLaporan } from "@/lib/api";

interface LaporanItem {
  id: number;
  judul: string;
  deskripsi: string;
  kategori: string;
  created_at: string;
  gambar?: string | null;
}

function parseGambar(gambar: string | null | undefined): string[] {
  if (!gambar) return [];
  try { const parsed = JSON.parse(gambar); return Array.isArray(parsed) ? parsed : [String(parsed)]; } catch { return [gambar]; }
}

export default function FeedScreen() {
  const router = useRouter();
  const [allLaporan, setAllLaporan] = useState<LaporanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeKategori, setActiveKategori] = useState("Semua");

  const load = async () => {
    try {
      const data = await fetchLaporan();
      setAllLaporan(data || []);
    } catch {
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const kategoriList = useMemo(() => {
    const set = new Set(allLaporan.map((l) => l.kategori).filter(Boolean));
    return ["Semua", ...Array.from(set)];
  }, [allLaporan]);

  const filtered = useMemo(() => {
    return allLaporan.filter((l) => {
      if (search && !l.judul.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeKategori !== "Semua" && l.kategori !== activeKategori) return false;
      return true;
    });
  }, [allLaporan, search, activeKategori]);

  const renderItem = ({ item }: { item: LaporanItem }) => {
    const images = parseGambar(item.gambar);
    const thumbnail = images.length > 0 ? images[0] : null;
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/(user)/laporan/${item.id}` as any)} activeOpacity={0.7}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="document-text" size={28} color="#cbd5e1" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.judul}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.deskripsi}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</Text>
            <Text style={styles.cardCategory}>{item.kategori || "Umum"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed Laporan</Text>
      </View>
      <Text style={styles.headerSub}>Semua laporan yang telah dibuat oleh warga</Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Cari judul laporan..." placeholderTextColor="#94a3b8" />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
      </View>

      <FlatList horizontal showsHorizontalScrollIndicator={false} data={kategoriList} keyExtractor={(item) => item}
        contentContainerStyle={styles.filterList}
        style={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.filterChip, activeKategori === item && styles.filterChipActive]} onPress={() => setActiveKategori(item)}>
            <Text style={[styles.filterChipText, activeKategori === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      : <FlatList data={filtered} keyExtractor={(item) => String(item.id)} renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {search ? `Tidak ada laporan dengan judul "${search}"` : "Belum ada laporan."}
              </Text>
              {(search || activeKategori !== "Semua") && (
                <TouchableOpacity onPress={() => { setSearch(""); setActiveKategori("Semua"); }}>
                  <Text style={styles.resetText}>Reset filter</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6b7280", paddingHorizontal: 20, marginBottom: 12 },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, height: 42, borderWidth: 1, borderColor: "#e2e8f0" },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  filterRow: { marginBottom: 8, maxHeight: 40 },
  filterList: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  filterChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterChipText: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  filterChipTextActive: { color: "#fff" },
  list: { padding: 20, paddingTop: 4 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  thumb: { width: 100, height: 100, backgroundColor: "#f1f5f9" },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardContent: { flex: 1, padding: 12, justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 4 },
  cardDesc: { fontSize: 12, color: "#6b7280", lineHeight: 16, marginBottom: 8 },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardDate: { fontSize: 11, color: "#94a3b8" },
  cardCategory: { fontSize: 10, color: "#6b7280", backgroundColor: "#f1f5f9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8, textAlign: "center" },
  resetText: { fontSize: 13, color: "#2563eb", fontWeight: "500", marginTop: 12 },
});
