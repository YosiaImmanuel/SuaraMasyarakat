import { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LocationPickerModal from '@/src/components/LocationPickerModal';
import { apiUpload, apiFetch } from '@/src/lib/api';
import { Category } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

export default function BuatLaporanScreen() {
  const [judul, setJudul] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [lokasi, setLokasi] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number; lng: number} | null>(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await apiFetch<Category[]>(ENDPOINTS.CATEGORIES.LIST);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, 10));
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!judul.trim()) {
      Alert.alert('Error', 'Judul harus diisi');
      return;
    }
    if (!categoryId) {
      Alert.alert('Error', 'Kategori harus dipilih');
      return;
    }
    if (!deskripsi.trim()) {
      Alert.alert('Error', 'Deskripsi harus diisi');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Anda harus menyertakan minimal 1 gambar sebagai bukti.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('judul', judul.trim());
      formData.append('category_id', String(categoryId));
      formData.append('deskripsi', deskripsi.trim());
      if (lokasi.trim()) formData.append('lokasi', lokasi.trim());

      images.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `photo_${index}.jpg`;
        const ext = filename.split('.').pop() || 'jpg';
        formData.append('gambar[]', {
          uri,
          type: `image/${ext}`,
          name: filename,
        } as any);
      });

      await apiUpload<{ message: string }>(ENDPOINTS.LAPORAN.CREATE, formData);
      Alert.alert('Berhasil', 'Laporan berhasil dibuat', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Buat Laporan Baru</Text>
              <Text style={styles.headerSubtitle}>Sampaikan pengaduan Anda</Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Judul Laporan *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Jalan Rusak di Jl. Merdeka"
              placeholderTextColor={Colors.light.textMuted}
              value={judul}
              onChangeText={setJudul}
              editable={!submitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    categoryId === cat.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      categoryId === cat.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.nama}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lokasi</Text>
            {lokasi ? (
              <View style={styles.locationCard}>
                <View style={styles.locationCardIcon}>
                  <Text style={styles.locationCardIconText}>📍</Text>
                </View>
                <View style={styles.locationCardInfo}>
                  <Text style={styles.locationCardAddress} numberOfLines={2}>{lokasi}</Text>
                  <Text style={styles.locationCardCoord}>
                    {selectedCoords?.lat.toFixed(5)}, {selectedCoords?.lng.toFixed(5)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.locationCardBtn}
                  onPress={() => setShowMapModal(true)}
                  disabled={submitting}
                >
                  <Text style={styles.locationCardBtnText}>Ubah</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.locationPickerBtn}
                onPress={() => setShowMapModal(true)}
                disabled={submitting}
              >
                <Text style={styles.locationPickerBtnText}>📍 Pilih Lokasi di Peta...</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deskripsi *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Jelaskan detail pengaduan Anda"
              placeholderTextColor={Colors.light.textMuted}
              value={deskripsi}
              onChangeText={setDeskripsi}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!submitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gambar Bukti * (min. 1, maks. 10)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImages} disabled={submitting}>
              <Text style={styles.imagePickerText}>+ Tambah Gambar</Text>
            </TouchableOpacity>
            {images.length > 0 && (
              <View style={styles.imagePreviewGrid}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewWrapper}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImage}
                      onPress={() => removeImage(index)}
                      disabled={submitting}
                    >
                      <MaterialIcons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Kirim Laporan</Text>
            )}
          </TouchableOpacity>
        </View>
        <LocationPickerModal
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          onSelect={(lat, lng, address) => {
            setLokasi(address);
            setSelectedCoords({ lat, lng });
            setShowMapModal(false);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingBottom: Spacing['3xl'],
  },
  header: {
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  form: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
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
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  categoryList: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  locationPickerBtn: {
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
  },
  locationPickerBtnText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  locationCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCardIconText: { fontSize: 16 },
  locationCardInfo: {
    flex: 1,
  },
  locationCardAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  locationCardCoord: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  locationCardBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  locationCardBtnText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
  },
  imagePickerText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  imagePreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  removeImage: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.light.destructive,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

