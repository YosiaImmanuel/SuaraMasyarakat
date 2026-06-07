import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';

interface Props {
  label: string;
  value: number;
  color?: string;
  icon?: string;
}

export default function StatCard({ label, value, color = Colors.light.primary }: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    ...Shadow.sm,
    flex: 1,
    minWidth: 100,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
});
