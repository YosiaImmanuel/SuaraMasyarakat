import { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/src/lib/auth-context';

export const unstable_settings = {
  anchor: '(user)',
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [fadeOut] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setReady(true));
    }, 2000);
    return () => clearTimeout(timer);
  }, [fadeOut]);

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

      {!ready && (
        <Animated.View style={[styles.splash, { opacity: fadeOut }]}>
          <Image
            source={require('@/assets/images/splash-screen.png')}
            style={styles.image}
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    zIndex: 999,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
