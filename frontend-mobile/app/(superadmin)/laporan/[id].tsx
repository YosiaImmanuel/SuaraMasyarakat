import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Image, Modal, Dimensions, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchLaporanById, fetchComments, createComment, deleteComment, updateLaporanStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Laporan, Comment } from "@/lib/types";

const statusColors: Record<string, string> = { pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444" };
const statusLabels: Record<string, string> = { pending: "Pending", approved: "Disetujui", rejected: "Ditolak" };

export default function SuperAdminLaporanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [laporan, setLaporan] = useState<Laporan | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const load = async () => {
    try {
      const [l, c] = await Promise.all([fetchLaporanById(id!), fetchComments(id!)]);
      setLaporan(l); setComments(c || []);
    } catch {
    } finally { setIsLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const handleStatusChange = (status: "approved" | "rejected") => {
    if (status === "rejected") {
      if (Platform.OS === "ios") {
        Alert.prompt(
          "Alasan Penolakan",
          "Masukkan alasan mengapa laporan ini ditolak:",
          async (reason) => {
            if (!reason) { Alert.alert("Error", "Alasan penolakan harus diisi."); return; }
            try {
              const { res } = await updateLaporanStatus(id!, status, reason);
              if (res.ok) { Alert.alert("Berhasil", "Status laporan diperbarui."); load(); }
              else Alert.alert("Error", "Gagal memperbarui status.");
            } catch { Alert.alert("Error", "Terjadi kesalahan."); }
          },
          "plain-text",
          "",
          "default"
        );
      } else {
        Alert.alert("Tolak Laporan", "Masukkan alasan penolakan:", [
          { text: "Batal", style: "cancel" },
          {
            text: "Tolak", onPress: async () => {
              try {
                const { res } = await updateLaporanStatus(id!, status, "Ditolak oleh admin");
                if (res.ok) { Alert.alert("Berhasil", "Status laporan diperbarui."); load(); }
                else Alert.alert("Error", "Gagal memperbarui status.");
              } catch { Alert.alert("Error", "Terjadi kesalahan."); }
            },
          },
        ]);
      }
    } else {
      Alert.alert("Setujui Laporan", "Yakin ingin menyetujui laporan ini?", [
        { text: "Batal", style: "cancel" },
        { text: "Setujui", onPress: async () => {
          try {
            const { res } = await updateLaporanStatus(id!, status);
            if (res.ok) { Alert.alert("Berhasil", "Status laporan diperbarui."); load(); }
            else Alert.alert("Error", "Gagal memperbarui status.");
          } catch { Alert.alert("Error", "Terjadi kesalahan."); }
        }},
      ]);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const { res } = await createComment(id!, newComment);
      if (res.ok) { setNewComment(""); load(); }
    } catch {
    } finally { setSending(false); }
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert("Hapus Komentar", "Yakin ingin menghapus komentar ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        try { const { res } = await deleteComment(commentId); if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId)); }
        catch {}
      }},
    ]);
  };

  const parseGambar = (gambar: string | null | undefined): string[] => {
    if (!gambar) return [];
    try { const parsed = JSON.parse(gambar); return Array.isArray(parsed) ? parsed : [String(parsed)]; } catch { return [gambar]; }
  };

  if (isLoading) return <SafeAreaView style={styles.safe}><ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 60 }} /></SafeAreaView>;
  if (!laporan) return <SafeAreaView style={styles.safe}><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#94a3b8" }}>Laporan tidak ditemukan</Text></View></SafeAreaView>;

  const images = parseGambar(laporan.gambar);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Laporan</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.badge, { backgroundColor: statusColors[laporan.status] + "20", alignSelf: "flex-start" }]}>
          <Text style={[styles.badgeText, { color: statusColors[laporan.status] }]}>{statusLabels[laporan.status]}</Text>
        </View>
        {laporan.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.rejectionText}>{laporan.rejection_reason}</Text>
          </View>
        )}
        <Text style={styles.judul}>{laporan.judul}</Text>
        <View style={styles.metaRow}><Ionicons name="person-outline" size={14} color="#6b7280" /><Text style={styles.metaText}>{laporan.nama_pelapor || "Anonim"}</Text></View>
        <View style={styles.metaRow}><Ionicons name="pricetag-outline" size={14} color="#6b7280" /><Text style={styles.metaText}>{laporan.kategori || "Umum"}</Text></View>
        {laporan.lokasi && <View style={styles.metaRow}><Ionicons name="location-outline" size={14} color="#6b7280" /><Text style={styles.metaText}>{laporan.lokasi}</Text></View>}
        <View style={styles.metaRow}><Ionicons name="calendar-outline" size={14} color="#6b7280" /><Text style={styles.metaText}>{new Date(laporan.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</Text></View>
        <View style={styles.divider} />
        <Text style={styles.deskripsi}>{laporan.deskripsi}</Text>
        {images.length > 0 && (
          <>
            <Text style={styles.photoTitle}>Bukti Foto ({images.length})</Text>
            <View style={styles.imageGrid}>{images.map((uri, i) => (<TouchableOpacity key={i} onPress={() => setLightboxUri(uri)}><Image source={{ uri }} style={styles.photo} /></TouchableOpacity>))}</View>
          </>
        )}

        {laporan.status === "pending" && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleStatusChange("approved")}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Setujui</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleStatusChange("rejected")}>
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Tolak</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />
        <Text style={styles.commentSectionTitle}>Komentar ({comments.length})</Text>
        {comments.length === 0 ? <Text style={styles.noComments}>Belum ada komentar.</Text> : comments.map((c) => (
          <View key={c.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(c.nama_user || "A").charAt(0).toUpperCase()}</Text></View>
              <View style={styles.commentMeta}><Text style={styles.commentUser}>{c.nama_user || "Anonim"}</Text><Text style={styles.commentTime}>{new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text></View>
              {(user?.id === c.user_id || user?.role === "admin" || user?.role === "super_admin") && <TouchableOpacity onPress={() => handleDeleteComment(c.id)}><Ionicons name="trash-outline" size={16} color="#94a3b8" /></TouchableOpacity>}
            </View>
            <Text style={styles.commentText}>{c.isi}</Text>
          </View>
        ))}
        <View style={styles.commentInputRow}>
          <TextInput style={styles.commentInput} value={newComment} onChangeText={setNewComment} placeholder="Tulis komentar..." placeholderTextColor="#94a3b8" />
          <TouchableOpacity style={[styles.sendBtn, (!newComment.trim() || sending) && styles.sendBtnDisabled]} onPress={handleComment} disabled={!newComment.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={!!lightboxUri} transparent animationType="fade">
        <View style={styles.lightbox}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxUri(null)}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
          {lightboxUri && <Image source={{ uri: lightboxUri }} style={styles.lightboxImage} resizeMode="contain" />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  scroll: { padding: 20, paddingBottom: 40 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  rejectionBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderRadius: 8, padding: 10, marginBottom: 8, gap: 6 },
  rejectionText: { fontSize: 12, color: "#ef4444", flex: 1 },
  judul: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  metaText: { fontSize: 13, color: "#6b7280" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 16 },
  deskripsi: { fontSize: 14, color: "#4b5563", lineHeight: 22 },
  photoTitle: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 10, marginTop: 16 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: { width: 100, height: 100, borderRadius: 8 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, gap: 8 },
  approveBtn: { backgroundColor: "#10b981" },
  rejectBtn: { backgroundColor: "#ef4444" },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  commentSectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 },
  noComments: { fontSize: 13, color: "#94a3b8", textAlign: "center", paddingVertical: 20 },
  commentCard: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  commentHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", marginRight: 8 },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  commentMeta: { flex: 1 },
  commentUser: { fontSize: 13, fontWeight: "600", color: "#111827" },
  commentTime: { fontSize: 11, color: "#94a3b8" },
  commentText: { fontSize: 13, color: "#4b5563", lineHeight: 18 },
  commentInputRow: { flexDirection: "row", gap: 8, marginTop: 16, backgroundColor: "#fff", borderRadius: 12, padding: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  commentInput: { flex: 1, fontSize: 14, color: "#111827", paddingHorizontal: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.5 },
  lightbox: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  lightboxClose: { position: "absolute", top: 60, right: 20, zIndex: 10 },
  lightboxImage: { width, height: height * 0.7 },
});
