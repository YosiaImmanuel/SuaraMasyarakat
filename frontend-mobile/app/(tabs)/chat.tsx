import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/src/lib/api';
import { User, Conversation } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';

type Tab = 'percakapan' | 'pengguna';

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('percakapan');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiFetch<{ success: boolean; data: Conversation[] }>(ENDPOINTS.CHAT.CONVERSATIONS);
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await apiFetch<{ success: boolean; data: User[] }>(ENDPOINTS.CHAT.USERS);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingUsers(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); setSearching(false); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: User[] }>(ENDPOINTS.CHAT.SEARCH, { params: { query: searchQuery.trim() } });
        setSearchResults(Array.isArray(res.data) ? res.data : []);
        setSearching(true);
      } catch { setSearchResults([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const roleColors: Record<string, string> = { user: Colors.light.primary, admin: Colors.light.approved, super_admin: '#f59e0b' };
  const roleLabels: Record<string, string> = { user: 'Warga', admin: 'Admin', super_admin: 'Super Admin' };

  function formatTime(dateStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr); const now = new Date(); const diff = now.getTime() - date.getTime(); const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Kemarin'; if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  function startChat(userId: number) {
    router.push(`/chat/${userId}`);
  }

  function renderConversation({ item }: { item: Conversation }) {
    return (
      <TouchableOpacity style={styles.userItem} onPress={() => startChat(item.user_id)} activeOpacity={0.7}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.nama.charAt(0).toUpperCase()}</Text></View>
        <View style={styles.userInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>{item.nama}</Text>
            <Text style={styles.timeText}>{formatTime(item.last_message_time)}</Text>
          </View>
          <View style={styles.lastMsgRow}>
            <Text style={styles.lastMsg} numberOfLines={1}>{item.last_message}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColors[item.role] + '20' }]}>
              <Text style={[styles.roleText, { color: roleColors[item.role] }]}>{roleLabels[item.role] || item.role}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderUser({ item }: { item: User }) {
    return (
      <TouchableOpacity style={styles.userItem} onPress={() => startChat(item.id)} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: roleColors[item.role] }]}>
          <Text style={styles.avatarText}>{item.nama.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nama}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: roleColors[item.role] + '20' }]}>
          <Text style={[styles.roleText, { color: roleColors[item.role] }]}>{roleLabels[item.role] || item.role}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const displayedUsers = searchQuery.trim().length >= 2 && searching
    ? searchResults
    : users;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Text style={styles.headerTitle}>Chat</Text>
        <Text style={styles.headerSubtitle}>Pesan dengan pengguna lain</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari pengguna berdasarkan nama atau email..."
          placeholderTextColor={Colors.light.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'percakapan' && styles.tabActive]} onPress={() => setActiveTab('percakapan')}>
          <Text style={[styles.tabText, activeTab === 'percakapan' && styles.tabTextActive]}>Percakapan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'pengguna' && styles.tabActive]} onPress={() => setActiveTab('pengguna')}>
          <Text style={[styles.tabText, activeTab === 'pengguna' && styles.tabTextActive]}>Pengguna</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'percakapan' ? (
        loading ? (<Loading />) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => String(item.user_id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchConversations(); setRefreshing(false); }} />}
            ListEmptyComponent={<EmptyState title="Belum ada percakapan" message="Cari pengguna di tab Pengguna untuk memulai chat" />}
          />
        )
      ) : (
        loadingUsers ? (<Loading />) : (
          <FlatList
            data={displayedUsers}
            renderItem={renderUser}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchUsers(); await fetchConversations(); setRefreshing(false); }} />}
            ListEmptyComponent={<EmptyState title="Tidak ada pengguna" message={searchQuery.trim().length >= 2 ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna tersedia'} />}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { backgroundColor: Colors.light.primary, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  searchInput: { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: 12, fontSize: 15, color: Colors.light.text },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.light.surface, borderRadius: BorderRadius.md, padding: 4, borderWidth: 1, borderColor: Colors.light.border },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.light.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { paddingBottom: Spacing['3xl'], flexGrow: 1 },
  userItem: { backgroundColor: Colors.light.surface, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, ...Shadow.sm },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userInfo: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  userName: { fontSize: 15, fontWeight: '600', color: Colors.light.text, flex: 1 },
  timeText: { fontSize: 12, color: Colors.light.textMuted, marginLeft: Spacing.sm },
  lastMsgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMsg: { fontSize: 13, color: Colors.light.textSecondary, flex: 1 },
  userEmail: { fontSize: 12, color: Colors.light.textMuted, marginTop: 1 },
  roleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginLeft: Spacing.sm },
  roleText: { fontSize: 10, fontWeight: '600' },
});
