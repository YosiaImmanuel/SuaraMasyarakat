import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl, Alert, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchUsers, createUser, updateUser, deleteUser } from "@/lib/api";
import { User } from "@/lib/types";

const roleColors: Record<string, string> = { user: "#2563eb", admin: "#f59e0b", super_admin: "#ef4444" };
const roleLabels: Record<string, string> = { user: "User", admin: "Admin", super_admin: "Super Admin" };

export default function SuperAdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ nama: "", email: "", password: "", role: "user" as User["role"] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data?.users || data || []);
    } catch {
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ nama: "", email: "", password: "", role: "user" });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ nama: u.nama, email: u.email, password: "", role: u.role });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.email.trim()) { Alert.alert("Error", "Nama dan email harus diisi."); return; }
    if (!editingUser && !form.password.trim()) { Alert.alert("Error", "Kata sandi harus diisi."); return; }
    setSaving(true);
    try {
      if (editingUser) {
        const payload: any = { nama: form.nama.trim(), email: form.email.trim(), role: form.role };
        if (form.password.trim()) payload.password = form.password.trim();
        const { res } = await updateUser(editingUser.id, payload);
        if (res.ok) { load(); setShowModal(false); }
        else Alert.alert("Error", "Gagal memperbarui pengguna.");
      } else {
        const { res } = await createUser({ nama: form.nama.trim(), email: form.email.trim(), password: form.password.trim(), role: form.role });
        if (res.ok) { load(); setShowModal(false); }
        else Alert.alert("Error", "Gagal menambah pengguna.");
      }
    } catch { Alert.alert("Error", "Terjadi kesalahan."); }
    finally { setSaving(false); }
  };

  const handleDelete = (u: User) => {
    Alert.alert("Hapus Pengguna", `Yakin ingin menghapus "${u.nama}"?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        try {
          const { res } = await deleteUser(u.id);
          if (res.ok) setUsers((prev) => prev.filter((x) => x.id !== u.id));
          else Alert.alert("Error", "Gagal menghapus pengguna.");
        } catch { Alert.alert("Error", "Terjadi kesalahan."); }
      }},
    ]);
  };

  const roles: User["role"][] = ["user", "admin", "super_admin"];

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: roleColors[item.role] }]}>
          <Text style={styles.avatarText}>{item.nama.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.nama}</Text>
          <Text style={styles.cardEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColors[item.role] + "20" }]}>
            <Text style={[styles.roleBadgeText, { color: roleColors[item.role] }]}>{roleLabels[item.role]}</Text>
          </View>
        </View>
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
        <Text style={styles.headerTitle}>Kelola Pengguna</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Cari pengguna..." placeholderTextColor="#94a3b8" />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
      </View>
      {isLoading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      : <FlatList data={filtered} keyExtractor={(item) => String(item.id)} renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="people-outline" size={48} color="#cbd5e1" /><Text style={styles.emptyText}>Tidak ada pengguna ditemukan</Text></View>}
        />
      }
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? "Edit Pengguna" : "Tambah Pengguna"}</Text>
            <View style={styles.field}><Text style={styles.label}>Nama</Text><TextInput style={styles.input} value={form.nama} onChangeText={(t) => setForm((p) => ({ ...p, nama: t }))} placeholder="Nama lengkap" placeholderTextColor="#94a3b8" /></View>
            <View style={styles.field}><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm((p) => ({ ...p, email: t }))} placeholder="Email" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" /></View>
            <View style={styles.field}><Text style={styles.label}>{editingUser ? "Kata Sandi Baru (kosongkan jika tidak diubah)" : "Kata Sandi"}</Text><TextInput style={styles.input} value={form.password} onChangeText={(t) => setForm((p) => ({ ...p, password: t }))} placeholder={editingUser ? "Biarkan kosong" : "Min. 6 karakter"} placeholderTextColor="#94a3b8" secureTextEntry /></View>
            <View style={styles.field}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.rolePicker}>
                {roles.map((r) => (
                  <TouchableOpacity key={r} style={[styles.roleOption, form.role === r && { backgroundColor: roleColors[r] + "20", borderColor: roleColors[r] }]} onPress={() => setForm((p) => ({ ...p, role: r }))}>
                    <Text style={[styles.roleOptionText, form.role === r && { color: roleColors[r], fontWeight: "600" }]}>{roleLabels[r]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, height: 42, borderWidth: 1, borderColor: "#e2e8f0" },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  list: { padding: 20, paddingTop: 8 },
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardEmail: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginTop: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 16, marginLeft: 12 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 30 },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 4, textTransform: "uppercase" },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827" },
  rolePicker: { flexDirection: "row", gap: 8 },
  roleOption: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  roleOptionText: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalBtnPrimary: { backgroundColor: "#2563eb" },
  modalBtnPrimaryText: { color: "#fff", fontWeight: "600" },
  modalBtnSecondary: { backgroundColor: "#f1f5f9" },
  modalBtnSecondaryText: { color: "#374151", fontWeight: "500" },
});
