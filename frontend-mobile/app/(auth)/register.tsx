import { useState } from 'react';
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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { apiFetch } from '@/src/lib/api';
import { ENDPOINTS } from '@/src/constants/api';

export default function RegisterScreen() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    minLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
  };

  async function handleRegister() {
    if (!nama.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }
    if (!passwordChecks.minLength || !passwordChecks.hasUpperCase) {
      Alert.alert('Error', 'Password minimal 6 karakter dan mengandung huruf kapital');
      return;
    }

    setLoading(true);
    try {
      await apiFetch<{ message: string }>(ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({
          nama: nama.trim(),
          email: email.trim(),
          password,
        }),
      });
      Alert.alert('Berhasil', 'Registrasi berhasil. Silakan login.', [
        { text: 'OK', onPress: () => router.push('/(auth)/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Registrasi Gagal', err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>SuaraMasyarakat</Text>
          <Text style={styles.tagline}>Pelaporan Pengaduan Masyarakat</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Daftar</Text>
          <Text style={styles.formSubtitle}>Buat akun baru Anda</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={Colors.light.textMuted}
              value={nama}
              onChangeText={setNama}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="contoh@email.com"
              placeholderTextColor={Colors.light.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Masukkan password"
                placeholderTextColor={Colors.light.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.checks}>
              <Text style={[styles.check, passwordChecks.minLength && styles.checkValid]}>
                {passwordChecks.minLength ? '✓' : '○'} Minimal 6 karakter
              </Text>
              <Text style={[styles.check, passwordChecks.hasUpperCase && styles.checkValid]}>
                {passwordChecks.hasUpperCase ? '✓' : '○'} Mengandung huruf kapital
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Daftar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/login')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Sudah punya akun? <Text style={styles.linkHighlight}>Masuk</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  form: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    ...Shadow.md,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  eyeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  eyeText: {
    fontSize: 20,
  },
  checks: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  check: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  checkValid: {
    color: Colors.light.success,
  },
  button: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  linkText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  linkHighlight: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
