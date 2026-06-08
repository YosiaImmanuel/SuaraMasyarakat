import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/src/lib/auth-context';

export const unstable_settings = {
  anchor: '(user)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(user)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(superadmin)" />
        <Stack.Screen
          name="laporan/[id]"
          options={{ headerShown: true, headerTitle: 'Detail Laporan', presentation: 'card' }}
        />
        <Stack.Screen
          name="chat/[userId]"
          options={{ headerShown: true, headerTitle: 'Percakapan', presentation: 'card' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
