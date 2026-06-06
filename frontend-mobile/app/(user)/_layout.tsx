import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function UserTabLayout() {
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
        options={{ title: "Beranda", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="laporan"
        options={{ title: "Laporan", tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: "Feed", tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "Pesan", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profil", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
