import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/lib/auth-context';
import { apiFetch } from '@/src/lib/api';
import { Laporan } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

type Tab = 'info' | 'keamanan' | 'akun';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Informasi' },
  { id: 'keamanan', label: 'Keamanan' },
  { id: 'akun', label: 'Akun' },
];

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Stats
  const [stats, setStats] = useState({ totalLaporan: 0, selesai: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Form state
  const [nama, setNama] = useState(user?.nama || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Delete account
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) return;
    setNama(user.nama || '');
    setEmail(user.email || '');

    const loadStats = async () => {
      try {
        const data = await apiFetch<Laporan[]>(ENDPOINTS.LAPORAN.LIST);
        const allLaporan = Array.isArray(data) ? data : [];
        const myLaporan = allLaporan.filter((l) => l.user_id === user.id);
        const total = myLaporan.length;
        const selesai = myLaporan.filter((l) => l.status === 'approved').length;
        setStats({ totalLaporan: total, selesai });
      } catch {
        setStats({ totalLaporan: 0, selesai: 0 });
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [user]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setIsEditing(false);
    clearMessages();
    setDeleteStep(0);
    setDeletePassword('');
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const initials = user?.nama
    ? user.nama.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Profile update
  const handleUpdateProfile = async () => {
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
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Password change
  const handleChangePassword = async () => {
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
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Masukkan kata sandi untuk melanjutkan');
      return;
    }
    setIsDeleting(true);
    clearMessages();
    try {
      await apiFetch(ENDPOINTS.AUTH.DELETE_ACCOUNT, {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword }),
      });
      await logout();
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  const roleLabel = user?.role === 'user' ? 'Masyarakat' : user?.role === 'admin' ? 'Admin' : 'Super Admin';

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
                    <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                  </View>
                  {joinDate ? (
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>📅 {joinDate}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.heroRight}>
              {statsLoading ? (
                <View style={styles.statsLoading}>
                  <View style={styles.statsSkeleton} />
                  <View style={styles.statsSkeleton} />
                </View>
              ) : (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statIcon}>📄</Text>
                      <Text style={styles.statValue}>{stats.totalLaporan}</Text>
                    </View>
                    <Text style={styles.statLabel}>Total Laporan</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statIcon}>✅</Text>
                      <Text style={styles.statValue}>{stats.selesai}</Text>
                    </View>
                    <Text style={styles.statLabel}>Selesai</Text>
                  </View>
                </View>
              )}
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
                onPress={() => handleTabChange(tab.id)}
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
              <Text style={[styles.alertIcon]}>{error ? '⚠️' : '✅'}</Text>
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
                  {!isEditing && (
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => setIsEditing(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {!isEditing ? (
                  <View style={styles.infoRows}>
                    {[
                      { icon: '👤', label: 'Nama Lengkap', value: user?.nama },
                      { icon: '✉️', label: 'Alamat Email', value: user?.email },
                      { icon: '🛡️', label: 'Peran', value: roleLabel },
                      { icon: '📅', label: 'Bergabung Pada', value: joinDate },
                    ].map((item, i, arr) => (
                      <View key={i}>
                        <View style={styles.infoRow}>
                          <View style={styles.infoIconBox}>
                            <Text style={styles.infoIcon}>{item.icon}</Text>
                          </View>
                          <View style={styles.infoTextWrap}>
                            <Text style={styles.infoLabel}>{item.label}</Text>
                            <Text style={styles.infoValue} numberOfLines={1}>{item.value || '-'}</Text>
                          </View>
                        </View>
                        {i < arr.length - 1 && <View style={styles.infoDivider} />}
                      </View>
                    ))}
                  </View>
                ) : (
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
                    <View style={styles.formActions}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                          setIsEditing(false);
                          setNama(user?.nama || '');
                          setEmail(user?.email || '');
                        }}
                        disabled={saving}
                      >
                        <Text style={styles.cancelBtnText}>Batal</Text>
                      </TouchableOpacity>
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
                )}
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
              </View>
            )}

            {activeTab === 'akun' && (
              <View>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
                    <Text style={styles.sectionSubtitle}>Kelola dan hapus akun Anda</Text>
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

                      {deleteStep === 0 && (
                        <View style={styles.deleteStep0}>
                          <TouchableOpacity
                            style={styles.deleteStartBtn}
                            onPress={() => setDeleteStep(1)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.deleteStartBtnText}>Lanjutkan Hapus Akun</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {deleteStep === 1 && (
                        <View style={styles.deleteStep1}>
                          <View style={styles.deleteWarning}>
                            <Text style={styles.deleteWarningText}>⚠️ Apakah Anda yakin? Tindakan ini tidak dapat dibatalkan.</Text>
                          </View>
                          <View style={styles.deleteActions}>
                            <TouchableOpacity
                              style={styles.deleteCancelBtn}
                              onPress={() => { setDeleteStep(0); setDeletePassword(''); }}
                            >
                              <Text style={styles.deleteCancelBtnText}>Batalkan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteConfirmBtn}
                              onPress={() => setDeleteStep(2)}
                            >
                              <Text style={styles.deleteConfirmBtnText}>Ya, Lanjutkan</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {deleteStep === 2 && (
                        <View style={styles.deleteStep2}>
                          <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>MASUKKAN KATA SANDI UNTUK KONFIRMASI</Text>
                            <View style={[styles.inputRow, styles.inputRowDanger]}>
                              <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Kata sandi Anda"
                                placeholderTextColor={Colors.light.textMuted}
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                                secureTextEntry={!showDeletePw}
                              />
                              <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowDeletePw((s) => !s)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Text style={styles.eyeText}>{showDeletePw ? '🙈' : '👁️'}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.deleteActions}>
                            <TouchableOpacity
                              style={styles.deleteCancelBtn}
                              onPress={() => { setDeleteStep(0); setDeletePassword(''); }}
                              disabled={isDeleting}
                            >
                              <Text style={styles.deleteCancelBtnText}>Batalkan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.deleteExecBtn, isDeleting && styles.disabledBtn]}
                              onPress={handleDeleteAccount}
                              disabled={isDeleting || !deletePassword}
                            >
                              {isDeleting ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <Text style={styles.deleteExecBtnText}>🗑️ Hapus Akun</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
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
    marginBottom: Spacing.lg,
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
  dateBadge: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  heroRight: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: Spacing.lg,
  },
  statsLoading: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  statsSkeleton: {
    width: 80,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: BorderRadius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: { fontSize: 14 },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textMuted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.light.borderLight,
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
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.md,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Info Rows
  infoRows: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 16 },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
  },

  // Edit Form
  editForm: { gap: Spacing.lg },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  formActionsRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
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

  // Inline Input Fields (login-like)
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
  inputRowDanger: {
    borderColor: Colors.light.destructive,
    backgroundColor: '#fef2f2',
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
  deleteStep0: {},
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
  deleteStep1: { gap: Spacing.md },
  deleteWarning: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  deleteWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
  },
  deleteCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  deleteStep2: { gap: Spacing.md },
  deleteExecBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  deleteExecBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
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


