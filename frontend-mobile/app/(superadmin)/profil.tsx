import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/src/lib/auth-context';
import { apiFetch } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

type Tab = 'info' | 'keamanan';

export default function SuperAdminProfilScreen() {
  const { user, refreshProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [nama, setNama] = useState(user?.nama || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleUpdateProfile() {
    if (!nama.trim() || !email.trim()) {
      Alert.alert('Error', 'Nama dan email harus diisi');
      return;
    }
    setSaving(true);
    try {
      await apiFetch(ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        body: JSON.stringify({ nama: nama.trim(), email: email.trim() }),
      });
      await refreshProfile();
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Password saat ini harus diisi');
      return;
    }
    if (newPassword.length < 6 || !/[A-Z]/.test(newPassword)) {
      Alert.alert('Error', 'Password baru minimal 6 karakter dan mengandung huruf kapital');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok');
      return;
    }
    setSaving(true);
    try {
      await apiFetch(ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        body: JSON.stringify({
          nama: user?.nama,
          email: user?.email,
          password: newPassword,
          current_password: currentPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Berhasil', 'Password berhasil diubah');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Hapus Akun',
      'Yakin ingin menghapus akun? Semua data akan terhapus permanen.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus Akun', style: 'destructive', onPress: () => {} },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user?.nama?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.nama}</Text>
          <View style={styles.headerRoleBadge}>
            <Text style={styles.headerRoleText}>Super Admin</Text>
          </View>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Informasi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'keamanan' && styles.tabActive]}
            onPress={() => setActiveTab('keamanan')}
          >
            <Text style={[styles.tabText, activeTab === 'keamanan' && styles.tabTextActive]}>
              Keamanan
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' ? (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                value={nama}
                onChangeText={setNama}
                editable={!saving}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Keluar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password Saat Ini</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                editable={!saving}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password Baru</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!saving}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konfirmasi Password Baru</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!saving}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleChangePassword}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Ubah Password</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Hapus Akun</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: Spacing['3xl'] },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 60,
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarLargeText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerRoleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  headerRoleText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: { backgroundColor: Colors.light.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  tabTextActive: { color: '#fff' },
  formSection: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  inputGroup: { gap: Spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logoutButton: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: { color: Colors.light.text, fontSize: 15, fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: Colors.light.destructive,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: { color: Colors.light.destructive, fontSize: 15, fontWeight: '600' },
});
