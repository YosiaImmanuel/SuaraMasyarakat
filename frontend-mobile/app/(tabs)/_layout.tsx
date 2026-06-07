import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/lib/auth-context';
import { Colors } from '@/constants/theme';

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <Text style={styles.loadingText}>Memuat...</Text>
    </View>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Beranda: '🏠',
    'Buat Laporan': '📝',
    Feed: '📰',
    Laporan: '📋',
    Kategori: '🏷️',
    Users: '👥',
    Chat: '💬',
    Profil: '👤',
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {icons[label] || '📄'}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const role = user?.role || 'user';

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isUser = role === 'user';
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';
  const canManage = isAdmin || isSuperAdmin;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused }) => <TabIcon label="Beranda" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="buat-laporan"
        options={{
          title: 'Buat Laporan',
          href: isUser ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="Buat Laporan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          href: isUser ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="Feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="laporan"
        options={{
          title: 'Laporan',
          href: canManage ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="Laporan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="kategori"
        options={{
          title: 'Kategori',
          href: canManage ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="Kategori" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          href: isSuperAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="Users" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => <TabIcon label="Chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon label="Profil" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.surface,
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    paddingTop: 4,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
