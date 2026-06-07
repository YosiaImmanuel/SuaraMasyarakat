import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

const icons: Record<string, { icon: string; color: string }> = {
  Beranda: { icon: '⬡', color: '#2563eb' },
  'Buat Laporan': { icon: '+', color: '#10b981' },
  Feed: { icon: '≡', color: '#f59e0b' },
  Laporan: { icon: '☰', color: '#8b5cf6' },
  Kategori: { icon: '⊞', color: '#ec4899' },
  Users: { icon: '⊕', color: '#06b6d4' },
  Chat: { icon: '↗', color: '#3b82f6' },
  Profil: { icon: '○', color: '#6b7280' },
};

interface Props {
  label: string;
  focused: boolean;
}

export default function TabBarIcon({ label, focused }: Props) {
  const config = icons[label] || { icon: '•', color: '#6b7280' };

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <View style={[styles.iconBg, { backgroundColor: focused ? config.color + '15' : 'transparent' }]}>
        <Text style={[styles.icon, focused && { color: config.color }]}>
          {focused ? config.icon : config.icon}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  containerFocused: {},
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#9ca3af',
  },
});
