import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { User, Conversation } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { useAuth } from '@/src/lib/auth-context';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';

export default function ChatListScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiFetch<Conversation[]>(ENDPOINTS.CHAT.CONVERSATIONS);
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch<User[]>(ENDPOINTS.CHAT.SEARCH, {
          params: { query: search.trim() },
        });
        setSearchResults(Array.isArray(data) ? data : []);
        setIsSearching(true);
      } catch {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  const roleColors: Record<string, string> = {
    user: Colors.light.textMuted,
    admin: Colors.light.approved,
    super_admin: Colors.light.pending,
  };

  function startChat(userId: number) {
    router.push(`/chat/${userId}`);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  function renderConversation({ item }: { item: Conversation }) {
    return (
      <TouchableOpacity style={styles.conversationItem} onPress={() => startChat(item.user_id)} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.nama.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>{item.nama}</Text>
            <Text style={styles.conversationTime}>{formatTime(item.last_message_time)}</Text>
          </View>
          <View style={styles.conversationBottom}>
            <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColors[item.role] + '20' }]}>
              <Text style={[styles.roleBadgeText, { color: roleColors[item.role] }]}>{item.role}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderUserResult({ item }: { item: User }) {
    return (
      <TouchableOpacity style={styles.conversationItem} onPress={() => startChat(item.id)} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.nama.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName}>{item.nama}</Text>
          <Text style={styles.lastMessage}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: roleColors[item.role] + '20' }]}>
          <Text style={[styles.roleBadgeText, { color: roleColors[item.role] }]}>{item.role}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <Text style={styles.headerSubtitle}>Pesan dengan pengguna lain</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari pengguna..."
          placeholderTextColor={Colors.light.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {search.trim().length >= 2 && isSearching ? (
        <FlatList
          data={searchResults}
          renderItem={renderUserResult}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="Pengguna tidak ditemukan" />}
        />
      ) : loading ? (
        <Loading />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => String(item.user_id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              title="Belum ada percakapan"
              message="Cari pengguna untuk memulai chat"
            />
          }
        />
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
  searchContainer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  searchInput: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
  },
  list: { paddingBottom: Spacing['3xl'] },
  conversationItem: {
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  conversationInfo: { flex: 1 },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: { fontSize: 15, fontWeight: '600', color: Colors.light.text, flex: 1 },
  conversationTime: { fontSize: 12, color: Colors.light.textMuted, marginLeft: Spacing.sm },
  conversationBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: { fontSize: 13, color: Colors.light.textSecondary, flex: 1 },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '600' },
});
