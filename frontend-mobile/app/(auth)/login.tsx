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
} from 'react-native';
import { router } from 'expo-router';
import { useAuth, getRoleDashboard } from '@/src/lib/auth-context';
import { apiFetch } from '@/src/lib/api';
import { AuthResponse } from '@/src/types';
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
  inputRadius: 6,
  buttonRadius: 6,
};

// ─── Animated Tab Switcher ────────────────────────────────────────────────────
function TabSwitcher({ active }: { active: 'login' | 'register' }) {
  const translateX = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: active === 'login' ? 0 : 1,
      useNativeDriver: true,
      stiffness: 380,
      damping: 30,
    }).start();
  }, [active]);

  // Pill width = half the tab container minus padding
  const CONTAINER_H_PADDING = 4;
  const PILL_WIDTH = (width - 48 - CONTAINER_H_PADDING * 2) / 2;

  const pillTranslate = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PILL_WIDTH],
  });

  return (
    <View style={styles.tabWrapper}>
      {/* Animated sliding pill */}
      <Animated.View
        style={[
          styles.tabPill,
          { width: PILL_WIDTH, transform: [{ translateX: pillTranslate }] },
        ]}
      />

      {/* Login tab */}
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

      {/* Register tab */}
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
export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Email dan password harus diisi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<AuthResponse>(ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      await login(res.token, res.user);
      router.replace(getRoleDashboard(res.user.role) as any);
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
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>SM</Text>
          </View>
          <Text style={styles.logoText}>SuaraMasyarakat</Text>
        </View>

        {/* ── Heading ── */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Selamat Datang</Text>
          <Text style={styles.subheading}>
            Masuk ke akun SuaraMasyarakat Anda untuk melanjutkan.
          </Text>
        </View>

        {/* ── Tab Switcher ── */}
        <TabSwitcher active="login" />

        {/* ── Error ── */}
        {!!error && (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        )}

        {/* ── Form ── */}
        <View style={styles.formBlock}>
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
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.submitInner}>
                <Text style={styles.submitText}>Masuk</Text>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          Dengan masuk, Anda menyetujui{' '}
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

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: WEB.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoIconText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
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

  alertBox: {
    backgroundColor: WEB.errorBg, borderWidth: 1,
    borderColor: WEB.errorBorder, borderRadius: 10, padding: 14, marginBottom: 16,
  },
  alertText: { color: WEB.errorText, fontSize: 13 },

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