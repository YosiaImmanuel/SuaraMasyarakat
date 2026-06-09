import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiFetch } from '@/src/lib/api';
import { Category } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';

export default function AdminKategoriScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [nama, setNama] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiFetch<Category[]>(ENDPOINTS.CATEGORIES.LIST);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  function openCreate() {
    setEditingCat(null);
    setNama('');
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setNama(cat.nama);
    setShowForm(true);
  }

  async function handleSave() {
    if (!nama.trim()) {
      Alert.alert('Error', 'Nama kategori harus diisi');
      return;
    }
    setSaving(true);
    try {
      if (editingCat) {
        await apiFetch(ENDPOINTS.CATEGORIES.UPDATE(editingCat.id), {
          method: 'PUT',
          body: JSON.stringify({ nama: nama.trim() }),
        });
      } else {
        await apiFetch(ENDPOINTS.CATEGORIES.CREATE, {
          method: 'POST',
          body: JSON.stringify({ nama: nama.trim() }),
        });
      }
      setShowForm(false);
      setEditingCat(null);
      setNama('');
      await fetchCategories();
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number) {
    Alert.alert('Hapus Kategori', 'Yakin ingin menghapus kategori ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(ENDPOINTS.CATEGORIES.DELETE(id), { method: 'DELETE' });
            setCategories((prev) => prev.filter((c) => c.id !== id));
          } catch (err: any) {
            Alert.alert('Gagal', err.message);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Kategori</Text>
            <Text style={styles.headerSubtitle}>Kelola kategori laporan</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addButtonText}>+ Tambah</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingCat ? 'Edit Kategori' : 'Kategori Baru'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama kategori"
            placeholderTextColor={Colors.light.textMuted}
            value={nama}
            onChangeText={setNama}
            editable={!saving}
          />
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => { setShowForm(false); setEditingCat(null); }}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {categories.length === 0 ? (
            <EmptyState title="Belum ada kategori" message="Tambahkan kategori baru" />
          ) : (
            categories.map((cat) => (
              <View key={cat.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.nama}</Text>
                  <Text style={styles.categoryDate}>
                    Dibuat {cat.created_at ? new Date(cat.created_at).toLocaleDateString('id-ID') : ''}
                  </Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity onPress={() => openEdit(cat)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(cat.id)}>
                    <Text style={styles.deleteText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    paddingBottom: Spacing['3xl'],
  },
  categoryItem: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadow.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryDate: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  editText: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteText: {
    color: Colors.light.destructive,
    fontWeight: '600',
    fontSize: 14,
  },
});
