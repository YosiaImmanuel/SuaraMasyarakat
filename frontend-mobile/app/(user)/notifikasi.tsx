import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { apiFetch } from '@/src/lib/api';
import { Notification } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';

export default function NotifikasiScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotif = useCallback(async () => {
    try {
      const data = await apiFetch<Notification[]>(ENDPOINTS.NOTIFICATIONS.LIST);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotif();
    }, [fetchNotif])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotif();
  };

  const markAsRead = async (id: number) => {
    try {
      await apiFetch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const deleteNotif = (id: number) => {
    Alert.alert('Hapus Notifikasi', 'Yakin ingin menghapus notifikasi ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(ENDPOINTS.NOTIFICATIONS.DELETE(id), { method: 'DELETE' });
            setNotifications((prev) => prev.filter((n) => n.id !== id));
          } catch {}
        },
      },
    ]);
  };

  const deleteAll = () => {
    Alert.alert('Hapus Semua', 'Hapus semua notifikasi?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus Semua',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(ENDPOINTS.NOTIFICATIONS.DELETE_ALL, { method: 'DELETE' });
            setNotifications([]);
          } catch {}
        },
      },
    ]);
  };

  const handlePress = (item: Notification) => {
    if (!item.is_read) markAsRead(item.id);
    if (item.type === 'chat' && item.reference_id) {
      router.push(`/chat/${item.reference_id}`);
    } else if (item.reference_id) {
      router.push(`/laporan/${item.reference_id}`);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'chat') return 'chat' as const;
    if (type === 'status_change') return 'info' as const;
    return 'notifications' as const;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}j lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (loading) return <Loading fullScreen />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Notifikasi</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} belum dibaca`
                : 'Tidak ada notifikasi baru'}
            </Text>
          </View>
        </View>
      </View>

      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <Text style={styles.actionCount}>{notifications.length} notifikasi</Text>
          <TouchableOpacity onPress={deleteAll} style={styles.deleteAllBtn}>
            <MaterialIcons name="delete-sweep" size={16} color={Colors.light.destructive} />
            <Text style={styles.deleteAllText}> Hapus Semua</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.length === 0 ? (
          <EmptyState
            title="Belum ada notifikasi"
            message="Notifikasi akan muncul di sini"
          />
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.notifIcon, !item.is_read && styles.notifIconUnread]}>
                <MaterialIcons
                  name={getIcon(item.type)}
                  size={18}
                  color={item.is_read ? Colors.light.textMuted : Colors.light.primary}
                />
              </View>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.notifMessage} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>
              </View>
              {!item.is_read && <View style={styles.unreadDot} />}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteNotif(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={16} color={Colors.light.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextWrap: { flex: 1, marginRight: Spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  actionCount: { fontSize: 13, color: Colors.light.textMuted, fontWeight: '500' },
  deleteAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.destructive,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  notifCardUnread: {
    backgroundColor: '#f0f7ff',
    borderColor: '#bfdbfe',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconUnread: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  notifBody: { flex: 1 },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  notifTitleUnread: { fontWeight: '700' },
  notifMessage: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifDate: { fontSize: 11, color: Colors.light.textMuted },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  deleteBtn: {
    padding: 4,
  },
});
