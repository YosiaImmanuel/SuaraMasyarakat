import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { Message } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/src/lib/auth-context';
import { initializeSocket, getSocket, sendMessage, disconnectSocket } from '@/src/lib/socket';
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

  const fetchMessages = useCallback(async () => {
    try {
      const data = await apiFetch<Message[]>(ENDPOINTS.CHAT.HISTORY(Number(userId)));
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchReceiverInfo = useCallback(async () => {
    try {
      const data = await apiFetch<any>(ENDPOINTS.USERS.DETAIL(Number(userId)));
      if (data?.nama) setReceiverName(data.nama);
    } catch {}
  }, [userId]);

  useEffect(() => {
    fetchMessages();
    fetchReceiverInfo();
  }, [fetchMessages, fetchReceiverInfo]);

  useEffect(() => {
    if (token) {
      initializeSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceiveMessage = (msg: Message) => {
      if (msg.sender_id === Number(userId) || msg.receiver_id === Number(userId)) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          if (exists) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleMessageSent = (msg: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageSent', handleMessageSent);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageSent', handleMessageSent);
    };
  }, [userId]);

  function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
    sendMessage(Number(userId), content.trim());
    setContent('');
    setSending(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function groupMessages(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach((msg) => {
      const date = new Date(msg.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
          ]}
        >
          <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  }

  function renderDateGroup({ item }: { item: { date: string; messages: Message[] } }) {
    return (
      <View>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        {item.messages.map((msg) => (
          <View key={msg.id}>{renderMessage({ item: msg })}</View>
        ))}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const groupedMessages = groupMessages(messages);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {groupedMessages.length === 0 ? (
        <EmptyState title="Belum ada pesan" message="Kirim pesan pertama Anda" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          renderItem={renderDateGroup}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
        <TouchableOpacity
          style={[styles.sendBtn, (!content.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!content.trim() || sending}
        >
          <Text style={styles.sendBtnText}>Kirim</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: Spacing.lg, paddingBottom: Spacing.md },
  dateSeparator: { alignItems: 'center', marginVertical: Spacing.md },
  dateText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  messageRow: { marginBottom: Spacing.sm, flexDirection: 'row' },
  messageRowMine: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  messageBubbleMine: {
    backgroundColor: Colors.light.chatSent,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: Colors.light.chatReceived,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, color: Colors.light.text, lineHeight: 20 },
  messageTextMine: { color: '#fff' },
  messageTime: { fontSize: 11, color: Colors.light.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
