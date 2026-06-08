import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { Message } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/src/lib/auth-context';
import { initializeSocket, getSocket } from '@/src/lib/socket';
import EmptyState from '@/src/components/ui/EmptyState';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_BUBBLE = SCREEN_WIDTH * 0.78;

export default function ChatDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [receiverName, setReceiverName] = useState('Percakapan');
  const flatListRef = useRef<FlatList>(null);

  const receiverId = Number(userId);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch<{ success: boolean; data: Message[] }>(ENDPOINTS.CHAT.HISTORY(receiverId));
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [receiverId]);

  const fetchReceiverInfo = useCallback(async () => {
    try {
      const data = await apiFetch<any>(ENDPOINTS.USERS.DETAIL(receiverId));
      if (data?.nama) setReceiverName(data.nama);
      else if (data?.data?.nama) setReceiverName(data.data.nama);
    } catch {}
  }, [receiverId]);

  useEffect(() => {
    fetchMessages();
    fetchReceiverInfo();
  }, [fetchMessages, fetchReceiverInfo]);

  useEffect(() => {
    if (!token) return;
    const socket = initializeSocket(token);

    socket.on('receiveMessage', (msg: Message) => {
      if (Number(msg.sender_id) !== Number(receiverId)) return;
      setMessages((prev) => {
        if (prev.some((m) => Number(m.id) === Number(msg.id))) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('messageSent', (msg: Message) => {
      setMessages((prev) => {
        const tempIdx = prev.findIndex((m) => m.id < 0 && Number(m.sender_id) === Number(msg.sender_id) && m.content === msg.content);
        if (tempIdx !== -1) {
          const copy = [...prev];
          copy[tempIdx] = msg;
          return copy;
        }
        if (prev.some((m) => Number(m.id) === Number(msg.id))) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageSent');
    };
  }, [token, receiverId]);

  function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
    const text = content.trim();
    const socket = getSocket();

    const tempMsg: Message = {
      id: -Date.now(),
      sender_id: user?.id || 0,
      receiver_id: receiverId,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setContent('');
    setSending(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);

    if (socket?.connected) {
      socket.emit('sendMessage', { receiverId, content: text });
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.light.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Stack.Screen options={{ title: receiverName }} />
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState title="Belum ada pesan" message={`Mulai percakapan dengan ${receiverName || 'pengguna'}`} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <MessageBubble item={item} isMine={Number(item.sender_id) === Number(user?.id)} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Tulis pesan..."
          placeholderTextColor={Colors.light.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={[styles.sendBtn, (!content.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!content.trim() || sending}>
          <Text style={styles.sendBtnText}>Kirim</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ item, isMine }: { item: Message; isMine: boolean }) {
  return (
    <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
      <View style={isMine ? styles.bubbleMine : styles.bubbleOther}>
        <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextOther]}>{item.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  msgList: { padding: Spacing.lg, paddingBottom: Spacing.md },
  msgRow: { marginBottom: Spacing.sm },
  msgRowMine: { alignItems: 'flex-end' },
  msgRowOther: { alignItems: 'flex-start' },
  bubbleMine: {
    backgroundColor: Colors.light.chatSent,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: MAX_BUBBLE,
  },
  bubbleOther: {
    backgroundColor: Colors.light.chatReceived,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: MAX_BUBBLE,
  },
  msgText: { fontSize: 15, color: Colors.light.text, lineHeight: 20 },
  msgTextMine: { color: '#fff' },
  msgTextOther: { color: Colors.light.text },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, backgroundColor: Colors.light.surface, borderTopWidth: 1, borderTopColor: Colors.light.border, gap: Spacing.sm },
  textInput: { flex: 1, backgroundColor: Colors.light.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.light.text, maxHeight: 80 },
  sendBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
