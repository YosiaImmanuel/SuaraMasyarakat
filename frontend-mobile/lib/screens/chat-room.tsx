import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getChatHistory, fetchUserById } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { sendMessage, setTyping, setStopTyping, getSocket } from "@/lib/socket";
import { Message, ChatUser } from "@/lib/types";

interface Props {
  userId: string;
  onBack?: () => void;
}

export default function ChatRoomScreen({ userId, onBack }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    const init = async () => {
      try {
        const [userData, history] = await Promise.all([
          fetchUserById(userId),
          getChatHistory(userId),
        ]);
        setChatUser({
          id: userData.id, nama: userData.nama, email: userData.email, role: userData.role,
        });
        setMessages(history?.data || history || []);
      } catch {
      } finally { setIsLoading(false); }
    };
    init();
  }, [userId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.sender_id !== Number(userId) && msg.receiver_id !== Number(userId)) return;
      setMessages((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };

    const handleTyping = (data: { userId: number }) => {
      if (data.userId === Number(userId)) setIsTyping(true);
    };
    const handleStopTyping = (data: { userId: number }) => {
      if (data.userId === Number(userId)) setIsTyping(false);
    };

    socket.off("receiveMessage");
    socket.on("receiveMessage", handleNewMessage);
    socket.off("userTyping");
    socket.on("userTyping", handleTyping);
    socket.off("userStoppedTyping");
    socket.on("userStoppedTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [userId]);

  const handleSend = () => {
    if (!inputText.trim() || !userId) return;
    sendMessage(Number(userId), inputText.trim());
    setInputText("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    setStopTyping(Number(userId));
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!userId) return;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    setTyping(Number(userId));
    typingTimeout.current = setTimeout(() => setStopTyping(Number(userId)), 2000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
        <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, isMine ? styles.msgTimeMine : styles.msgTimeOther]}>
            {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (onBack ? onBack() : router.back())}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{chatUser?.nama?.charAt(0).toUpperCase() || "?"}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{chatUser?.nama || "Loading..."}</Text>
            <Text style={styles.headerRole}>{chatUser?.role}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyChatText}>Kirim pesan pertama untuk memulai percakapan</Text>
              </View>
            }
          />
        )}
        {isTyping && <Text style={styles.typingIndicator}>{chatUser?.nama} sedang mengetik...</Text>}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Ketik pesan..."
            placeholderTextColor="#94a3b8"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f9fe" },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
  },
  headerInfo: { flexDirection: "row", alignItems: "center", marginLeft: 12, flex: 1 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", marginRight: 10 },
  headerAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  headerRole: { fontSize: 11, color: "#6b7280", textTransform: "capitalize" },
  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 8, flexDirection: "row" },
  msgRowMine: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  msgBubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  msgBubbleMine: { backgroundColor: "#2563eb", borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: "#fff", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#e2e8f0" },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMine: { color: "#fff" },
  msgTextOther: { color: "#111827" },
  msgTime: { fontSize: 10, marginTop: 4 },
  msgTimeMine: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  msgTimeOther: { color: "#94a3b8", textAlign: "right" },
  emptyChat: { alignItems: "center", paddingVertical: 60 },
  emptyChatText: { fontSize: 13, color: "#94a3b8", marginTop: 8, textAlign: "center" },
  typingIndicator: { fontSize: 12, color: "#6b7280", paddingHorizontal: 20, paddingBottom: 4, fontStyle: "italic" },
  inputBar: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e2e8f0",
  },
  input: {
    flex: 1, backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14, color: "#111827", maxHeight: 100,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
});
