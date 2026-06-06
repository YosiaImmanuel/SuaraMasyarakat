import { useEffect } from "react";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function Index() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (token && user) {
      const { getRoleDashboard } = require("@/lib/auth-context");
      const dashboard = getRoleDashboard(user.role);
      router.replace(dashboard);
    }
  }, [isLoading, token, user]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!token || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f9fe",
  },
});
