import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchNotifications, markNotificationsAsRead, markNotificationAsReadById } from "@/lib/api";
import { Notification } from "@/lib/types";

const typeIcons: Record<string, string> = {
  status: "checkmark-circle", comment: "chatbubble", chat: "chatbubble-ellipses", rejection: "close-circle",
};
const typeColors: Record<string, string> = {
  status: "#10b981", comment: "#2563eb", chat: "#8b5cf6", rejection: "#ef4444",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data || []);
    } catch {
    } finally { setIsLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handlePress = async (item: Notification) => {
    if (!item.is_read) {
      try {
        await markNotificationAsReadById(item.id);
        setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      } catch {}
    }
    if (item.reference_id) {
      router.push(`/(user)/laporan/${item.reference_id}` as any);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderItem = ({ item }: { item: Notification }) => {
    const icon = typeIcons[item.type] || "notifications";
    const color = typeColors[item.type] || "#6b7280";
    return (
      <TouchableOpacity style={[styles.card, !item.is_read && styles.unread]} onPress={() => handlePress(item)} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.is_read && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        {!item.is_read && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Tandai dibaca</Text>
          </TouchableOpacity>
        )}
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Belum ada notifikasi</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  markAll: { fontSize: 13, color: "#2563eb", fontWeight: "500" },
  list: { padding: 20 },
  card: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 10, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  unread: { backgroundColor: "#eef2ff" },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: "500", color: "#374151" },
  titleUnread: { fontWeight: "700", color: "#111827" },
  message: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  time: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563eb", marginLeft: 8 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
});
