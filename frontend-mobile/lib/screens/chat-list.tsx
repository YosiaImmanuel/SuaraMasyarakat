import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getConversations, searchChatUsers } from "@/lib/api";
import { ChatUser } from "@/lib/types";

interface Props {
  baseChatPath: string;
}

export default function ChatListScreen({ baseChatPath }: Props) {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data?.conversations || data || []);
    } catch {
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchChatUsers(searchQuery);
        setSearchResults(data?.users || data || []);
      } catch {
      } finally { setSearching(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const goToChat = (userId: number) => {
    router.push(`${baseChatPath}/${userId}` as any);
  };

  const renderConversation = ({ item }: { item: any }) => {
    const chatUser = item.user || item;
    return (
      <TouchableOpacity style={styles.chatCard} onPress={() => goToChat(chatUser.id)} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{chatUser.nama?.charAt(0).toUpperCase() || "?"}</Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{chatUser.nama}</Text>
            {item.last_message_time && (
              <Text style={styles.chatTime}>
                {new Date(item.last_message_time).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </Text>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message || "Belum ada pesan"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.headerTitle}>Pesan</Text>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari pengguna..."
          placeholderTextColor="#94a3b8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {searchQuery.trim() ? (
        searching ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.chatCard} onPress={() => goToChat(item.id)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.nama.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{item.nama}</Text>
                  <Text style={styles.lastMessage}>{item.email}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada hasil</Text>}
          />
        )
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item, i) => String(item.user?.id || i)}
          renderItem={renderConversation}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>Belum ada percakapan</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827", paddingHorizontal: 20, paddingVertical: 16 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12,
    backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, height: 42, borderWidth: 1, borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  list: { padding: 20, paddingTop: 8 },
  chatCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  chatName: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  chatTime: { fontSize: 11, color: "#94a3b8", marginLeft: 8 },
  lastMessage: { fontSize: 13, color: "#6b7280" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
});
