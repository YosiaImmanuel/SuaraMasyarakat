import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl, Alert, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import { Category } from "@/lib/types";

export default function SuperAdminKategoriScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [nama, setNama] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data || []);
    } catch {
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const openCreate = () => {
    setEditingCategory(null);
    setNama("");
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setNama(cat.nama);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nama.trim()) { Alert.alert("Error", "Nama kategori harus diisi."); return; }
    setSaving(true);
    try {
      if (editingCategory) {
        const { res } = await updateCategory(editingCategory.id, nama.trim());
        if (res.ok) { setCategories((prev) => prev.map((c) => c.id === editingCategory.id ? { ...c, nama: nama.trim() } : c)); setShowModal(false); }
        else Alert.alert("Error", "Gagal memperbarui kategori.");
      } else {
        const { res, data } = await createCategory(nama.trim());
        if (res.ok) { setCategories((prev) => [...prev, data]); setShowModal(false); }
        else Alert.alert("Error", "Gagal menambah kategori.");
      }
    } catch { Alert.alert("Error", "Terjadi kesalahan."); }
    finally { setSaving(false); }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert("Hapus Kategori", `Yakin ingin menghapus kategori "${cat.nama}"?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        try {
          const { res } = await deleteCategory(cat.id);
          if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== cat.id));
          else Alert.alert("Error", "Gagal menghapus kategori.");
        } catch { Alert.alert("Error", "Terjadi kesalahan."); }
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Ionicons name="pricetag" size={18} color="#2563eb" />
        <Text style={styles.cardText}>{item.nama}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => openEdit(item)}><Ionicons name="create-outline" size={18} color="#2563eb" /></TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)}><Ionicons name="trash-outline" size={18} color="#ef4444" /></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kategori</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      : <FlatList data={categories} keyExtractor={(item) => String(item.id)} renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="pricetags-outline" size={48} color="#cbd5e1" /><Text style={styles.emptyText}>Belum ada kategori</Text></View>}
        />
      }
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</Text>
            <TextInput style={styles.modalInput} value={nama} onChangeText={setNama} placeholder="Nama kategori" placeholderTextColor="#94a3b8" autoFocus />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSecondary]} onPress={() => setShowModal(false)}><Text style={styles.modalBtnSecondaryText}>Batal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  addBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  list: { padding: 20 },
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardContent: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  cardText: { fontSize: 15, fontWeight: "500", color: "#111827" },
  cardActions: { flexDirection: "row", gap: 16 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 40 },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 16 },
  modalInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827", marginBottom: 16 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalBtnPrimary: { backgroundColor: "#2563eb" },
  modalBtnPrimaryText: { color: "#fff", fontWeight: "600" },
  modalBtnSecondary: { backgroundColor: "#f1f5f9" },
  modalBtnSecondaryText: { color: "#374151", fontWeight: "500" },
});
