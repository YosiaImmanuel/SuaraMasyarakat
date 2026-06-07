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
import { router } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { User, Role } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';

const roles: { label: string; value: Role }[] = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'super_admin' },
];

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ nama: '', email: '', password: '', role: 'user' as Role });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch<User[]>(ENDPOINTS.USERS.LIST);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search.trim() || u.nama.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function openCreate() {
    setEditingUser(null);
    setFormData({ nama: '', email: '', password: '', role: 'user' });
    setShowForm(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setFormData({ nama: user.nama, email: user.email, password: '', role: user.role });
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.nama.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Nama dan email harus diisi');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      Alert.alert('Error', 'Password harus diisi untuk user baru');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, any> = {
        nama: formData.nama.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };
      if (formData.password.trim()) body.password = formData.password;

      if (editingUser) {
        await apiFetch(ENDPOINTS.USERS.UPDATE(editingUser.id), {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(ENDPOINTS.USERS.CREATE, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      await fetchUsers();
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number, name: string) {
    Alert.alert('Hapus User', `Yakin ingin menghapus ${name}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(ENDPOINTS.USERS.DELETE(id), { method: 'DELETE' });
            setUsers((prev) => prev.filter((u) => u.id !== id));
          } catch (err: any) {
            Alert.alert('Gagal', err.message);
          }
        },
      },
    ]);
  }

  const roleColors: Record<string, string> = {
    user: Colors.light.primary,
    admin: Colors.light.approved,
    super_admin: Colors.light.pending,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kelola Users</Text>
        <Text style={styles.headerSubtitle}>Manajemen pengguna aplikasi</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari user..."
          placeholderTextColor={Colors.light.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !roleFilter && styles.filterChipActive]}
          onPress={() => setRoleFilter('')}
        >
          <Text style={[styles.filterChipText, !roleFilter && styles.filterChipTextActive]}>Semua</Text>
        </TouchableOpacity>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.filterChip, roleFilter === r.value && styles.filterChipActive]}
            onPress={() => setRoleFilter(roleFilter === r.value ? '' : r.value)}
          >
            <Text style={[styles.filterChipText, roleFilter === r.value && styles.filterChipTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingUser ? 'Edit User' : 'User Baru'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama"
            placeholderTextColor={Colors.light.textMuted}
            value={formData.nama}
            onChangeText={(v) => setFormData((p) => ({ ...p, nama: v }))}
            editable={!saving}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.light.textMuted}
            value={formData.email}
            onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!saving}
          />
          <TextInput
            style={styles.input}
            placeholder={editingUser ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
            placeholderTextColor={Colors.light.textMuted}
            value={formData.password}
            onChangeText={(v) => setFormData((p) => ({ ...p, password: v }))}
            secureTextEntry
            editable={!saving}
          />
          <View style={styles.roleSelector}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleChip, formData.role === r.value && styles.roleChipActive]}
                onPress={() => setFormData((p) => ({ ...p, role: r.value }))}
                disabled={saving}
              >
                <Text style={[styles.roleChipText, formData.role === r.value && styles.roleChipTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)} disabled={saving}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Simpan</Text>}
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
          {filteredUsers.length === 0 ? (
            <EmptyState title="Tidak ada user" message="Belum ada pengguna terdaftar" />
          ) : (
            filteredUsers.map((u) => (
              <View key={u.id} style={styles.userItem}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{u.nama.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.nama}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: roleColors[u.role] + '20' }]}>
                  <Text style={[styles.roleBadgeText, { color: roleColors[u.role] }]}>{u.role}</Text>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity onPress={() => openEdit(u)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(u.id, u.nama)}>
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
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    width: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  filterRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  filterChipText: { fontSize: 13, color: Colors.light.text, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  formCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  roleSelector: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  roleChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  roleChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  roleChipText: { fontSize: 13, color: Colors.light.text, fontWeight: '500' },
  roleChipTextActive: { color: '#fff' },
  formActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: { color: Colors.light.textSecondary, fontWeight: '600' },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  list: { paddingBottom: Spacing['3xl'] },
  userItem: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  userEmail: { fontSize: 12, color: Colors.light.textMuted, marginTop: 1 },
  roleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  userActions: { flexDirection: 'row', gap: Spacing.md },
  editText: { color: Colors.light.primary, fontWeight: '600', fontSize: 13 },
  deleteText: { color: Colors.light.destructive, fontWeight: '600', fontSize: 13 },
});
