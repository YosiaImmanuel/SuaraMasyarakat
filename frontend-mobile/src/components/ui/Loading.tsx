import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ message = 'Memuat...', fullScreen = false }: Props) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  text: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
