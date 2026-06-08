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

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Informasi' },
  { id: 'keamanan', label: 'Keamanan' },
];

export default function SuperAdminProfilScreen() {
  const { user, refreshProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [nama, setNama] = useState(user?.nama || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const initials = user?.nama
    ? user.nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  async function handleUpdateProfile() {
    if (!nama.trim() || !email.trim()) {
      setError('Nama dan email harus diisi');
      return;
    }
    setSaving(true);
    clearMessages();
    try {
      await apiFetch(ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        body: JSON.stringify({ nama: nama.trim(), email: email.trim() }),
      });
      await refreshProfile();
      setSuccess('Profil berhasil diperbarui');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    clearMessages();
    if (!currentPassword.trim()) {
      setError('Password saat ini harus diisi');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password baru harus mengandung huruf kapital');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
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
      setSuccess('Password berhasil diubah');
    } catch (err: any) {
      setError(err.message);
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.pageHeaderTitle}>Profil</Text>
              <Text style={styles.pageHeaderSubtitle}>Kelola informasi akun Anda</Text>
            </View>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAccent} />
          <View style={styles.heroBody}>
            <View style={styles.heroLeft}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{initials}</Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroRoleLabel}>PROFIL PENGGUNA</Text>
                <Text style={styles.heroName}>{user?.nama}</Text>
                <Text style={styles.heroEmail}>{user?.email}</Text>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>Super Admin</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Main Card with Tabs */}
        <View style={styles.mainCard}>
          {/* Tab Bar */}
          <View style={styles.tabRow}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => { setActiveTab(tab.id); clearMessages(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alert Messages */}
          {(error || success) ? (
            <View style={[styles.alertBox, error ? styles.alertError : styles.alertSuccess]}>
              <Text style={styles.alertIcon}>{error ? '⚠️' : '✅'}</Text>
              <Text style={[styles.alertText, error ? { color: '#dc2626' } : { color: '#059669' }]}>
                {error || success}
              </Text>
              <TouchableOpacity onPress={clearMessages} activeOpacity={0.7}>
                <Text style={styles.alertClose}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'info' && (
              <View>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
                    <Text style={styles.sectionSubtitle}>Detail akun dan identitas Anda</Text>
                  </View>
                </View>

                <View style={styles.editForm}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>NAMA LENGKAP</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={nama}
                        onChangeText={setNama}
                        editable={!saving}
                        placeholder="Masukkan nama lengkap"
                        placeholderTextColor={Colors.light.textMuted}
                      />
                    </View>
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>ALAMAT EMAIL</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!saving}
                        placeholder="nama@contoh.com"
                        placeholderTextColor={Colors.light.textMuted}
                      />
                    </View>
                  </View>
                  <View style={styles.formActionsRight}>
                    <TouchableOpacity
                      style={[styles.saveBtn, saving && styles.disabledBtn]}
                      onPress={handleUpdateProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveBtnText}>💾 Simpan Perubahan</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'keamanan' && (
              <View>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Ubah Kata Sandi</Text>
                    <Text style={styles.sectionSubtitle}>Pastikan kata sandi Anda kuat dan unik</Text>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>KATA SANDI SAAT INI</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Masukkan kata sandi saat ini"
                      placeholderTextColor={Colors.light.textMuted}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrent}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowCurrent((s) => !s)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.eyeText}>{showCurrent ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>KATA SANDI BARU</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Minimal 6 karakter"
                      placeholderTextColor={Colors.light.textMuted}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNew}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowNew((s) => !s)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.eyeText}>{showNew ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>KONFIRMASI KATA SANDI</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Ulangi kata sandi baru"
                      placeholderTextColor={Colors.light.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirm}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirm((s) => !s)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Validation Hints */}
                <View style={styles.hintsRow}>
                  {[
                    { label: 'Min. 6 karakter', pass: newPassword.length >= 6 },
                    { label: 'Huruf kapital (A-Z)', pass: /[A-Z]/.test(newPassword) },
                    { label: 'Kata sandi cocok', pass: newPassword.length > 0 && newPassword === confirmPassword },
                  ].map((hint) => (
                    <View
                      key={hint.label}
                      style={[styles.hintChip, hint.pass && styles.hintChipPass]}
                    >
                      <Text style={[styles.hintIcon, hint.pass && { opacity: 1 }]}>
                        {hint.pass ? '✅' : '○'}
                      </Text>
                      <Text style={[styles.hintText, hint.pass && styles.hintTextPass]}>
                        {hint.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.formActionsRight}>
                  <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.disabledBtn]}
                    onPress={handleChangePassword}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>🔒 Simpan Kata Sandi</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Delete Account */}
                <View style={styles.deleteSection}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionTitle}>Hapus Akun</Text>
                      <Text style={styles.sectionSubtitle}>Hapus akun Anda secara permanen</Text>
                    </View>
                  </View>
                  <View style={styles.deleteCard}>
                    <View style={styles.deleteCardInner}>
                      <View style={styles.deleteIconBox}>
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </View>
                      <View style={styles.deleteTextWrap}>
                        <Text style={styles.deleteTitle}>Hapus Akun Secara Permanen</Text>
                        <Text style={styles.deleteDesc}>
                          Semua data Anda akan dihapus selamanya. Tindakan ini tidak dapat dibatalkan.
                        </Text>
                        <TouchableOpacity
                          style={styles.deleteStartBtn}
                          onPress={handleDeleteAccount}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteStartBtnText}>Hapus Akun</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.logoutBtnText}>🚪 Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: Spacing['3xl'] },

  pageHeader: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  pageHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  pageHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Hero
  heroCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  heroAccent: {
    height: 6,
    backgroundColor: Colors.light.primary,
  },
  heroBody: {
    padding: Spacing.xl,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  heroInfo: { flex: 1 },
  heroRoleLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.light.primary,
    marginBottom: 2,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 1,
  },
  heroEmail: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginBottom: Spacing.sm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },

  // Main Card
  mainCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  tabTextActive: {
    color: Colors.light.primary,
  },

  // Alerts
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  alertError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  alertIcon: { fontSize: 16 },
  alertText: { flex: 1, fontSize: 13, fontWeight: '500' },
  alertClose: { fontSize: 16, color: '#9ca3af', paddingLeft: 4 },

  tabContent: { padding: Spacing.lg },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  // Edit Form
  editForm: { gap: Spacing.lg },
  formActionsRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
  },
  saveBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    minWidth: 140,
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Inline Input Fields
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    height: 44,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.light.text,
    height: '100%',
  },
  eyeButton: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: { fontSize: 17 },

  // Password fields
  hintsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hintChipPass: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  hintIcon: { fontSize: 12, opacity: 0.4 },
  hintText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textMuted,
  },
  hintTextPass: {
    color: '#059669',
  },

  // Delete Account
  deleteSection: { marginTop: Spacing.xl },
  deleteCard: {
    borderRadius: BorderRadius.lg,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    overflow: 'hidden',
  },
  deleteCardInner: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  deleteIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: { fontSize: 20 },
  deleteTextWrap: { flex: 1 },
  deleteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  deleteDesc: {
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  deleteStartBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#fee2e2',
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  deleteStartBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },

  // Logout
  logoutBtn: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
