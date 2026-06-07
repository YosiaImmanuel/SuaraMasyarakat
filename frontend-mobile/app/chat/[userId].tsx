import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { Message } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/src/lib/auth-context';
import { initializeSocket, getSocket } from '@/src/lib/socket';
import EmptyState from '@/src/components/ui/EmptyState';

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

    socket.on('connect', () => {
      console.log('Chat socket connected');
    });

    socket.on('receiveMessage', (msg: Message) => {
      if (msg.sender_id !== receiverId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('messageSent', (msg: Message) => {
      setMessages((prev) => {
        const tempIdx = prev.findIndex((m) => m.id < 0 && m.sender_id === msg.sender_id && m.content === msg.content);
        if (tempIdx !== -1) {
          const copy = [...prev];
          copy[tempIdx] = msg;
          return copy;
        }
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('userTyping', ({ senderId }: { senderId: number }) => {
      if (senderId === receiverId) {
        // Could show typing indicator
      }
    });

    socket.on('userStoppedTyping', ({ senderId }: { senderId: number }) => {
      if (senderId === receiverId) {
        // Could hide typing indicator
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageSent');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [token, receiverId]);

  function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
    const text = content.trim();
    const socket = getSocket();

    // Optimistic update with negative id so messageSent can replace it
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

  function groupMessages(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach((msg) => {
      const date = new Date(msg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const last = groups[groups.length - 1];
      if (last && last.date === date) { last.messages.push(msg); }
      else { groups.push({ date, messages: [msg] }); }
    });
    return groups;
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.msgText, isMine && styles.msgTextMine]}>{item.content}</Text>
          <Text style={[styles.msgTime, isMine && styles.msgTimeMine]}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.light.primary} /></View>;
  }

  const groupedMessages = groupMessages(messages);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {groupedMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState title="Belum ada pesan" message={`Mulai percakapan dengan ${receiverName || 'pengguna'}`} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          renderItem={({ item }) => (
            <View>
              <View style={styles.dateSep}><Text style={styles.dateText}>{item.date}</Text></View>
              {item.messages.map((msg: Message) => <View key={msg.id}>{renderMessage({ item: msg })}</View>)}
            </View>
          )}
          keyExtractor={(item) => item.date}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  msgList: { padding: Spacing.lg, paddingBottom: Spacing.md },
  dateSep: { alignItems: 'center', marginVertical: Spacing.md },
  dateText: { fontSize: 12, color: Colors.light.textMuted, backgroundColor: Colors.light.background, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, overflow: 'hidden' },
  msgRow: { marginBottom: Spacing.sm, flexDirection: 'row' },
  msgRowMine: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  bubbleMine: { backgroundColor: Colors.light.chatSent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.light.chatReceived, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: Colors.light.text, lineHeight: 20 },
  msgTextMine: { color: '#fff' },
  msgTime: { fontSize: 11, color: Colors.light.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, backgroundColor: Colors.light.surface, borderTopWidth: 1, borderTopColor: Colors.light.border, gap: Spacing.sm },
  textInput: { flex: 1, backgroundColor: Colors.light.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: 10, fontSize: 15, color: Colors.light.text, maxHeight: 80 },
  sendBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: BorderRadius.md },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
