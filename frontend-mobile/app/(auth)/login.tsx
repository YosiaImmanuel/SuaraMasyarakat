"use client";

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
  Image,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "@/constants/api";


// ─── Replace these with your actual auth helpers ───────────────────────────
async function loginAPI(email: string, password: string) {
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("LOGIN URL:", `${API_BASE_URL}/auth/login`);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    console.log("STATUS:", res.status);
    console.log("DATA:", data);

    return { res, data };
  } catch (error) {
    console.log("FETCH ERROR:", error);
    throw error;
  }
}

function getRoleDashboard(role: string) {
  // Adjust to your actual role → route mapping
  switch (role) {
    case "admin":
      return "/(tabs)/admin";
    default:
      return "/(tabs)";
  }
}
// ──────────────────────────────────────────────────────────────────────────

type Tab = "login" | "register";

export default function AuthScreen() {
  const router = useRouter();

  // ── shared state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── animated indicator ────────────────────────────────────────────────────
  const tabAnim = useRef(new Animated.Value(0)).current; // 0 = login, 1 = register

  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: activeTab === "login" ? 0 : 1,
      useNativeDriver: false,
      stiffness: 380,
      damping: 30,
    }).start();
  }, [activeTab]);

  // ── error fade ────────────────────────────────────────────────────────────
  const errorOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (error || successMessage) {
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      errorOpacity.setValue(0);
    }
  }, [error, successMessage]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setError("");
    setSuccessMessage("");
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const { res, data } = await loginAPI(email, password);
      if (!res.ok) {
        throw new Error(
          data.message || "Gagal login, periksa kembali email dan password Anda."
        );
      }
      // TODO: persist token → e.g. SecureStore.setItemAsync('token', data.token)
      const dashboard = getRoleDashboard(data.user.role);
      router.replace(dashboard as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    if (password.length < 6) {
      setError("Kata sandi minimal harus terdiri dari 6 karakter.");
      setIsLoading(false);
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Kata sandi harus mengandung minimal satu huruf besar (A-Z).");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal melakukan registrasi.");

      setSuccessMessage("Registrasi berhasil! Silakan masuk dengan akun baru Anda.");
      setNama("");
      setPassword("");
      switchTab("login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── derived tab indicator position ───────────────────────────────────────
  // We'll position the white pill using translateX
  const pillLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["1%", "51%"], // roughly half the tab bar
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <View style={styles.logoRow}>
            {/* Replace with your actual logo — Image requires a local asset or URI */}
            <View style={styles.logoPlaceholder}>
              <Ionicons name="megaphone" size={20} color="#1d4ed8" />
            </View>
            <Text style={styles.brandName}>SuaraMasyarakat</Text>
          </View>

          {/* ── Heading ──────────────────────────────────────────────────── */}
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>
              {activeTab === "login" ? "Selamat Datang" : "Buat Akun Baru"}
            </Text>
            <Text style={styles.subheading}>
              {activeTab === "login"
                ? "Masuk ke akun SuaraMasyarakat Anda untuk melanjutkan."
                : "Bergabunglah dan sampaikan aspirasi Anda untuk Indonesia."}
            </Text>
          </View>

          {/* ── Tab switcher ─────────────────────────────────────────────── */}
          <View style={styles.tabBar}>
            {/* animated white pill */}
            <Animated.View style={[styles.tabPill, { left: pillLeft }]} />

            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => switchTab("login")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "login" && styles.tabLabelActive,
                ]}
              >
                Masuk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => switchTab("register")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "register" && styles.tabLabelActive,
                ]}
              >
                Daftar
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Error / Success banner ───────────────────────────────────── */}
          {(error || successMessage) && (
            <Animated.View
              style={[
                styles.banner,
                error ? styles.bannerError : styles.bannerSuccess,
                { opacity: errorOpacity },
              ]}
            >
              <Text
                style={error ? styles.bannerTextError : styles.bannerTextSuccess}
              >
                {error || successMessage}
              </Text>
            </Animated.View>
          )}

          {/* ── LOGIN form ───────────────────────────────────────────────── */}
          {activeTab === "login" && (
            <View style={styles.form}>
              <Field label="Alamat Email">
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nama@contoh.com"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Field>

              <Field label="Kata Sandi">
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.inputPassword]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#cbd5e1"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
              </Field>

              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitLabel}>Masuk</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#fff"
                      style={{ marginLeft: 6 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── REGISTER form ────────────────────────────────────────────── */}
          {activeTab === "register" && (
            <View style={styles.form}>
              <Field label="Nama Lengkap">
                <TextInput
                  style={styles.input}
                  value={nama}
                  onChangeText={setNama}
                  placeholder="Nama Lengkap Anda"
                  placeholderTextColor="#cbd5e1"
                  autoCapitalize="words"
                />
              </Field>

              <Field label="Alamat Email">
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nama@contoh.com"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Field>

              <Field label="Kata Sandi">
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.inputPassword]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#cbd5e1"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordHints}>
                  <Text style={styles.hint}>
                    • Minimal 6 karakter
                  </Text>
                  <Text style={styles.hint}>
                    • Wajib mengandung minimal satu huruf kapital (A-Z)
                  </Text>
                </View>
              </Field>

              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitLabel}>Daftar Akun</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#fff"
                      style={{ marginLeft: 6 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <Text style={styles.footer}>
            Dengan {activeTab === "login" ? "masuk" : "mendaftar"}, Anda
            menyetujui{" "}
            <Text style={styles.footerLink}>Syarat Layanan</Text> dan{" "}
            <Text style={styles.footerLink}>Kebijakan Privasi</Text>{" "}
            SuaraMasyarakat.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Small helper component ────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f9fe",
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 48,
  },

  // Logo
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 18,
    color: "#1d4ed8",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontWeight: "500",
  },

  // Heading
  headingBlock: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(226,232,240,0.5)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    position: "relative",
    height: 44,
  },
  tabPill: {
    position: "absolute",
    top: 4,
    width: "48%",
    height: 36,
    backgroundColor: "#ffffff",
    borderRadius: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  tabLabelActive: {
    color: "#1d4ed8",
  },

  // Banner
  banner: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  bannerError: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  bannerSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  bannerTextError: {
    color: "#dc2626",
    fontSize: 13,
  },
  bannerTextSuccess: {
    color: "#16a34a",
    fontSize: 13,
  },

  // Form
  form: {
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  input: {
    height: 48,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
  },
  passwordWrap: {
    position: "relative",
  },
  inputPassword: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  passwordHints: {
    marginTop: 6,
    gap: 2,
  },
  hint: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 16,
  },

  // Submit button
  submitBtn: {
    height: 48,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 11,
    color: "#9ca3af",
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  footerLink: {
    color: "#2563eb",
  },
});