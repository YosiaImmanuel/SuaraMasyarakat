import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/constants/api';

const { width } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
const WEB = {
  bg: '#f6f9fe',
  primary: '#2563eb',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#d1d5db',
  errorBg: '#fef2f2',
  errorText: '#dc2626',
  errorBorder: '#fecaca',
  successBg: '#f0fdf4',
  successText: '#16a34a',
  successBorder: '#bbf7d0',
  checkValid: '#16a34a',
  inputRadius: 6,
  buttonRadius: 6,
};

// ─── Animated Tab Switcher ────────────────────────────────────────────────────
function TabSwitcher({ active }: { active: 'login' | 'register' }) {
  const translateX = useState(new Animated.Value(1))[0];

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: active === 'login' ? 0 : 1,
      useNativeDriver: true,
      stiffness: 380,
      damping: 30,
    }).start();
  }, [active]);

  const CONTAINER_H_PADDING = 4;
  const PILL_WIDTH = (width - 48 - CONTAINER_H_PADDING * 2) / 2;

  const pillTranslate = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PILL_WIDTH],
  });

  return (
    <View style={styles.tabWrapper}>
      <Animated.View
        style={[
          styles.tabPill,
          { width: PILL_WIDTH, transform: [{ translateX: pillTranslate }] },
        ]}
      />
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => {
          if (active !== 'login') router.replace('/(auth)/login');
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, active === 'login' && styles.tabTextActive]}>
          Masuk
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => {
          if (active !== 'register') router.replace('/(auth)/register');
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, active === 'register' && styles.tabTextActive]}>
          Daftar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const passwordChecks = {
    minLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
  };

  async function handleRegister() {
    if (!nama.trim() || !email.trim() || !password.trim()) {
      setError('Semua field harus diisi');
      return;
    }
    if (!passwordChecks.minLength || !passwordChecks.hasUpperCase) {
      setError('Password minimal 6 karakter dan mengandung huruf kapital');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await apiFetch<{ message: string }>(ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ nama: nama.trim(), email: email.trim(), password }),
      });
      setSuccessMessage('Registrasi berhasil! Silakan masuk dengan akun baru Anda.');
      setTimeout(() => router.replace('/(auth)/login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo ── */}
                <View style={styles.logoRow}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>SuaraMasyarakat</Text>
        </View>

        {/* ── Heading ── */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Buat Akun Baru</Text>
          <Text style={styles.subheading}>
            Bergabunglah dan sampaikan aspirasi Anda untuk Indonesia.
          </Text>
        </View>

        {/* ── Tab Switcher ── */}
        <TabSwitcher active="register" />

        {/* ── Error / Success ── */}
        {!!error && (
          <View style={[styles.alertBox, { backgroundColor: WEB.errorBg, borderColor: WEB.errorBorder }]}>
            <Text style={[styles.alertText, { color: WEB.errorText }]}>{error}</Text>
          </View>
        )}
        {!!successMessage && (
          <View style={[styles.alertBox, { backgroundColor: WEB.successBg, borderColor: WEB.successBorder }]}>
            <Text style={[styles.alertText, { color: WEB.successText }]}>{successMessage}</Text>
          </View>
        )}

        {/* ── Form ── */}
        <View style={styles.formBlock}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NAMA LENGKAP</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={nama}
                onChangeText={setNama}
                placeholder="Nama Lengkap Anda"
                placeholderTextColor={WEB.textMuted}
                autoCapitalize="words"
                editable={!loading}
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
                placeholder="nama@contoh.com"
                placeholderTextColor={WEB.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>KATA SANDI</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={WEB.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.checksBlock}>
              <Text style={[styles.checkItem, passwordChecks.minLength && styles.checkItemValid]}>
                {passwordChecks.minLength ? '✓' : '•'} Kata sandi harus memiliki panjang minimal 6 karakter
              </Text>
              <Text style={[styles.checkItem, passwordChecks.hasUpperCase && styles.checkItemValid]}>
                {passwordChecks.hasUpperCase ? '✓' : '•'} Wajib mengandung minimal satu huruf kapital (A-Z)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.submitInner}>
                <Text style={styles.submitText}>Daftar Akun</Text>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          Dengan mendaftar, Anda menyetujui{' '}
          <Text style={styles.footerLink}>Syarat Layanan</Text>
          {' '}dan{' '}
          <Text style={styles.footerLink}>Kebijakan Privasi</Text>
          {' '}SuaraMasyarakat.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WEB.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  logoImage: {
  width: 36,
  height: 36,
},
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoText: {
    fontSize: 20, fontWeight: '600', color: WEB.primary, letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  headingBlock: { marginBottom: 24 },
  heading: {
    fontSize: 30, fontWeight: '800', color: WEB.text,
    letterSpacing: -0.5, lineHeight: 36, marginBottom: 6,
  },
  subheading: { fontSize: 15, color: WEB.textSecondary, lineHeight: 22 },

  // Tab Switcher
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(226,232,240,0.5)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    position: 'relative',
  },
  tabPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButton: { flex: 1, paddingVertical: 9, alignItems: 'center', zIndex: 1 },
  tabText: { fontSize: 14, fontWeight: '500', color: WEB.textSecondary },
  tabTextActive: { color: WEB.primary, fontWeight: '600' },

  alertBox: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 },
  alertText: { fontSize: 13 },

  formBlock: { gap: 18 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: WEB.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WEB.surface, borderWidth: 1,
    borderColor: WEB.border, borderRadius: WEB.inputRadius, height: 44,
  },
  input: { flex: 1, paddingHorizontal: 16, fontSize: 16, color: WEB.text, height: '100%' },
  eyeButton: { paddingHorizontal: 12, height: '100%', justifyContent: 'center', alignItems: 'center' },
  eyeText: { fontSize: 17 },

  checksBlock: { gap: 4, marginTop: 6 },
  checkItem: { fontSize: 11, color: WEB.textSecondary, lineHeight: 17 },
  checkItemValid: { color: WEB.checkValid },

  submitButton: {
    backgroundColor: WEB.primary, borderRadius: WEB.buttonRadius,
    height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: WEB.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: '#ffffff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  arrowIcon: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  footer: {
    marginTop: 32, textAlign: 'center', fontSize: 12,
    color: '#9ca3af', lineHeight: 18, paddingHorizontal: 24,
  },
  footerLink: { color: WEB.primary },
});