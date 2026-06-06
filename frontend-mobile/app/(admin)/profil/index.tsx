import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { updateProfileAPI } from "@/lib/api";

export default function AdminProfileScreen() {
  const { user, login, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nama, setNama] = useState(user?.nama || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { res, data } = await updateProfileAPI({ nama, email });
      if (res.ok) {
        const { getProfile } = await import("@/lib/api");
        const profile = await getProfile();
        await login(token!, profile);
        setEditing(false);
        Alert.alert("Berhasil", "Profil berhasil diperbarui.");
      } else Alert.alert("Error", data.message || "Gagal memperbarui profil.");
    } catch { Alert.alert("Error", "Terjadi kesalahan."); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (password.length < 6) { Alert.alert("Error", "Kata sandi minimal 6 karakter."); return; }
    if (!/[A-Z]/.test(password)) { Alert.alert("Error", "Kata sandi harus mengandung huruf kapital."); return; }
    setSaving(true);
    try {
      const { res, data } = await updateProfileAPI({ nama: user!.nama, email: user!.email, password });
      if (res.ok) { Alert.alert("Berhasil", "Kata sandi berhasil diubah."); setShowPasswordForm(false); setPassword(""); }
      else Alert.alert("Error", data.message || "Gagal mengubah kata sandi.");
    } catch { Alert.alert("Error", "Terjadi kesalahan."); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroAvatar}><Text style={styles.heroAvatarText}>{user?.nama?.charAt(0).toUpperCase() || "?"}</Text></View>
          <Text style={styles.heroName}>{user?.nama}</Text>
          <View style={styles.heroRole}><Text style={styles.heroRoleText}>Admin</Text></View>
          <Text style={styles.heroEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          {editing ? (
            <>
              <View style={styles.field}><Text style={styles.label}>Nama</Text><TextInput style={styles.input} value={nama} onChangeText={setNama} /></View>
              <View style={styles.field}><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View>
              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setEditing(false)}><Text style={styles.btnSecondaryText}>Batal</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSave} disabled={saving}>{saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnPrimaryText}>Simpan</Text>}</TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <ProfileRow label="Nama" value={user?.nama} />
              <ProfileRow label="Email" value={user?.email} />
              <ProfileRow label="Role" value="Admin" />
              <ProfileRow label="Bergabung" value={user?.created_at ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"} />
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}><Ionicons name="create-outline" size={16} color="#2563eb" /><Text style={styles.editBtnText}>Edit Profil</Text></TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keamanan</Text>
          {showPasswordForm ? (
            <>
              <View style={styles.field}><Text style={styles.label}>Kata Sandi Baru</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Min. 6 karakter" placeholderTextColor="#94a3b8" /></View>
              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setShowPasswordForm(false)}><Text style={styles.btnSecondaryText}>Batal</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleChangePassword} disabled={saving}>{saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnPrimaryText}>Ubah</Text>}</TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPasswordForm(true)}><Ionicons name="lock-closed-outline" size={20} color="#6b7280" /><Text style={styles.actionBtnText}>Ubah Kata Sandi</Text><Ionicons name="chevron-forward" size={18} color="#cbd5e1" /></TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.profileRow}><Text style={styles.profileLabel}>{label}</Text><Text style={styles.profileValue}>{value || "-"}</Text></View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  scroll: { paddingBottom: 40 },
  hero: { alignItems: "center", paddingVertical: 24, backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 16, marginBottom: 16, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  heroAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroAvatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  heroName: { fontSize: 20, fontWeight: "700", color: "#111827" },
  heroRole: { backgroundColor: "#eef2ff", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  heroRoleText: { fontSize: 12, fontWeight: "600", color: "#2563eb", textTransform: "capitalize" },
  heroEmail: { fontSize: 13, color: "#6b7280", marginTop: 8 },
  section: { backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 },
  profileRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  profileLabel: { fontSize: 13, color: "#6b7280" },
  profileValue: { fontSize: 13, color: "#111827", fontWeight: "500" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, gap: 4 },
  editBtnText: { fontSize: 13, color: "#2563eb", fontWeight: "500" },
  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 4, textTransform: "uppercase" },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnPrimaryText: { color: "#fff", fontWeight: "600" },
  btnSecondary: { backgroundColor: "#f1f5f9" },
  btnSecondaryText: { color: "#374151", fontWeight: "500" },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  actionBtnText: { flex: 1, fontSize: 14, color: "#374151", marginLeft: 12 },
});
