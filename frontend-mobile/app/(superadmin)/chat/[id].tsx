import { useLocalSearchParams } from "expo-router";
import ChatRoomScreen from "@/lib/screens/chat-room";

export default function SuperAdminChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatRoomScreen userId={id || ""} />;
}
