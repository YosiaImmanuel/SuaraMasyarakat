import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRequireAuth } from "@/lib/use-auth";

export default function AdminTabLayout() {
  useRequireAuth(["admin"]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e2e8f0", paddingBottom: 4, height: 56 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="laporan"
        options={{ title: "Laporan", tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="kategori"
        options={{ title: "Kategori", tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "Pesan", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: "Profil", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
