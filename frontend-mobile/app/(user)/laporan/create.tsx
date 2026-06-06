import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { fetchCategories, createLaporan } from "@/lib/api";
import { Category } from "@/lib/types";

export default function CreateLaporanScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats || []);
        if (cats && cats.length > 0) setCategoryId(cats[0].id);
      } catch {
      } finally { setIsLoading(false); }
    })();
  }, []);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", allowsMultipleSelection: true, selectionLimit: 10 - images.length, quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 10));
    }
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!judul.trim()) { Alert.alert("Error", "Judul laporan harus diisi."); return; }
    if (!deskripsi.trim()) { Alert.alert("Error", "Deskripsi laporan harus diisi."); return; }
    if (!categoryId) { Alert.alert("Error", "Pilih kategori laporan."); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("judul", judul.trim());
      formData.append("deskripsi", deskripsi.trim());
      formData.append("category_id", String(categoryId));
      if (lokasi.trim()) formData.append("lokasi", lokasi.trim());

      images.forEach((uri, i) => {
        const filename = uri.split("/").pop() || `photo_${i}.jpg`;
        const ext = filename.split(".").pop() || "jpg";
        formData.append("gambar[]", {
          uri: Platform.OS === "android" ? uri : uri,
          type: `image/${ext === "png" ? "png" : "jpeg"}`,
          name: filename,
        } as any);
      });

      const { res } = await createLaporan(formData);
      if (res.ok) {
        Alert.alert("Berhasil", "Laporan berhasil dikirim.", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message || "Gagal mengirim laporan.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Terjadi kesalahan.");
    } finally { setSaving(false); }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Laporan Baru</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Judul Laporan</Text>
          <TextInput style={styles.input} value={judul} onChangeText={setJudul} placeholder="Masukkan judul laporan" placeholderTextColor="#94a3b8" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Kategori</Text>
          {categories.length > 0 ? (
            <>
              <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                <Text style={selectedCategory ? styles.pickerText : styles.pickerPlaceholder}>{selectedCategory ? selectedCategory.nama : "Pilih kategori"}</Text>
                <Ionicons name={showCategoryPicker ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.pickerDropdown}>
                  {categories.map((cat) => (
                    <TouchableOpacity key={cat.id} style={[styles.pickerItem, categoryId === cat.id && styles.pickerItemActive]}
                      onPress={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}>
                      <Text style={[styles.pickerItemText, categoryId === cat.id && styles.pickerItemTextActive]}>{cat.nama}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : <ActivityIndicator size="small" color="#2563eb" />}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Lokasi (opsional)</Text>
          <TextInput style={styles.input} value={lokasi} onChangeText={setLokasi} placeholder="Masukkan lokasi" placeholderTextColor="#94a3b8" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput style={[styles.input, styles.textArea]} value={deskripsi} onChangeText={setDeskripsi} placeholder="Jelaskan detail laporan Anda" placeholderTextColor="#94a3b8" multiline numberOfLines={5} textAlignVertical="top" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Foto Bukti (maks. 10)</Text>
          <View style={styles.imageRow}>
            {images.map((uri, i) => (
              <View key={i} style={styles.imageWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(i)}><Ionicons name="close-circle" size={20} color="#ef4444" /></TouchableOpacity>
              </View>
            ))}
            {images.length < 10 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="camera-outline" size={28} color="#94a3b8" />
                <Text style={styles.addImageText}>Tambah Foto</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity style={[styles.submitBtn, saving && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="send" size={18} color="#fff" /><Text style={styles.submitText}>Kirim Laporan</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  scroll: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827" },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  pickerText: { fontSize: 14, color: "#111827" },
  pickerPlaceholder: { fontSize: 14, color: "#94a3b8" },
  pickerDropdown: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, marginTop: 4, overflow: "hidden" },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  pickerItemActive: { backgroundColor: "#eef2ff" },
  pickerItemText: { fontSize: 14, color: "#374151" },
  pickerItemTextActive: { color: "#2563eb", fontWeight: "600" },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  imageWrap: { position: "relative" },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  removeImg: { position: "absolute", top: -6, right: -6 },
  addImageBtn: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa" },
  addImageText: { fontSize: 9, color: "#94a3b8", marginTop: 2 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 16, gap: 8, marginTop: 10, shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
