import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiFetch } from '@/src/lib/api';
import { Laporan, Comment } from '@/src/types';
import { ENDPOINTS } from '@/src/constants/api';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import StatusBadge from '@/src/components/ui/StatusBadge';
import Loading from '@/src/components/ui/Loading';
import EmptyState from '@/src/components/ui/EmptyState';
import { useAuth } from '@/src/lib/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LaporanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canManage = user?.role === 'admin' || user?.role === 'super_admin';
  const isOwner = (userId: number) => user?.id === userId;

  const [laporan, setLaporan] = useState<Laporan | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const [laporanData, commentsData] = await Promise.all([
        apiFetch<Laporan>(ENDPOINTS.LAPORAN.DETAIL(Number(id))),
        apiFetch<Comment[]>(ENDPOINTS.COMMENTS.LIST(Number(id))),
      ]);
      setLaporan(laporanData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Laporan tidak ditemukan');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleChangeStatus(status: string) {
    setChangingStatus(true);
    try {
      const body: Record<string, string> = { status };
      if (status === 'rejected' && rejectionReason.trim()) {
        body.rejection_reason = rejectionReason.trim();
      }
      await apiFetch(ENDPOINTS.LAPORAN.STATUS(Number(id)), {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setLaporan((prev) => prev ? { ...prev, status: status as Laporan['status'] } : null);
      setRejectModalVisible(false);
      setRejectionReason('');
      Alert.alert('Berhasil', `Status laporan diubah menjadi ${status}`);
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setChangingStatus(false);
    }
  }

  function handleApprove() {
    Alert.alert('Setujui Laporan', 'Setujui laporan ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Setujui', onPress: () => handleChangeStatus('approved') },
    ]);
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const res = await apiFetch<{ id: number; message: string }>(ENDPOINTS.COMMENTS.CREATE, {
        method: 'POST',
        body: JSON.stringify({ laporan_id: Number(id), isi: newComment.trim() }),
      });
      setComments((prev) => [
        ...prev,
        {
          id: res.id,
          laporan_id: Number(id),
          user_id: user?.id || 0,
          isi: newComment.trim(),
          created_at: new Date().toISOString(),
          nama_user: user?.nama,
        },
      ]);
      setNewComment('');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setSendingComment(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    Alert.alert('Hapus Komentar', 'Yakin ingin menghapus komentar ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(ENDPOINTS.COMMENTS.DELETE(commentId), { method: 'DELETE' });
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (err: any) {
            Alert.alert('Gagal', err.message);
          }
        },
      },
    ]);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function parseImages(gambar: string | null): string[] {
    if (!gambar) return [];
    try {
      const parsed = JSON.parse(gambar);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (loading) return <Loading fullScreen />;
  if (!laporan) return <EmptyState title="Laporan tidak ditemukan" />;

  const images = parseImages(laporan.gambar);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.judul}>{laporan.judul}</Text>
              <Text style={styles.kategori}>{laporan.kategori}</Text>
            </View>
            <StatusBadge status={laporan.status} />
          </View>

          <Text style={styles.deskripsi}>{laporan.deskripsi}</Text>

          {laporan.lokasi && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📍 Lokasi</Text>
              <Text style={styles.infoValue}>{laporan.lokasi}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Dilaporkan</Text>
            <Text style={styles.infoValue}>{formatDate(laporan.created_at)}</Text>
          </View>

          {laporan.nama_pelapor && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>👤 Pelapor</Text>
              <Text style={styles.infoValue}>{laporan.nama_pelapor}</Text>
            </View>
          )}

          {laporan.updated_at !== laporan.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🔄 Diperbarui</Text>
              <Text style={styles.infoValue}>{formatDate(laporan.updated_at)}</Text>
            </View>
          )}

          {isAdmin && (
            <View style={styles.adminActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton, laporan.status === 'approved' && styles.actionDisabled]}
                onPress={() => laporan.status !== 'approved' && handleApprove()}
                disabled={changingStatus || laporan.status === 'approved'}
              >
                {changingStatus ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>✓ Setujui</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.pendingButton, laporan.status === 'pending' && styles.actionDisabled]}
                onPress={() => laporan.status !== 'pending' && handleChangeStatus('pending')}
                disabled={changingStatus || laporan.status === 'pending'}
              >
                {changingStatus ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>↻ Pending</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton, laporan.status === 'rejected' && styles.actionDisabled]}
                onPress={() => laporan.status !== 'rejected' && setRejectModalVisible(true)}
                disabled={changingStatus || laporan.status === 'rejected'}
              >
                <Text style={styles.actionButtonText}>✕ Tolak</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Galeri ({images.length})</Text>
            <View style={styles.galleryGrid}>
              {images.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setLightboxImage(url)}
                  style={styles.galleryItem}
                >
                  <Image source={{ uri: url }} style={styles.galleryImage} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Komentar ({comments.length})</Text>

          {comments.length === 0 ? (
            <EmptyState title="Belum ada komentar" message="Jadilah yang pertama berkomentar" />
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.nama_user?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentName}>{comment.nama_user || 'Anonymous'}</Text>
                    <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                  </View>
                  {(canManage || isOwner(comment.user_id)) && (
                    <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                      <Text style={styles.deleteCommentText}>Hapus</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.commentContent}>{comment.isi}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.commentInputBar}>
        <TextInput
          style={styles.commentInput}
          placeholder="Tulis komentar..."
          placeholderTextColor={Colors.light.textMuted}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newComment.trim() || sendingComment) && styles.sendButtonDisabled]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || sendingComment}
        >
          {sendingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Kirim</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alasan Penolakan</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masukkan alasan penolakan..."
              placeholderTextColor={Colors.light.textMuted}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setRejectModalVisible(false); setRejectionReason(''); }}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !rejectionReason.trim() && styles.modalConfirmDisabled]}
                onPress={() => handleChangeStatus('rejected')}
                disabled={!rejectionReason.trim() || changingStatus}
              >
                {changingStatus ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Tolak</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {lightboxImage && (
        <TouchableOpacity style={styles.lightbox} onPress={() => setLightboxImage(null)} activeOpacity={1}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxImage(null)}>
            <Text style={styles.lightboxCloseText}>×</Text>
          </TouchableOpacity>
          <Image source={{ uri: lightboxImage }} style={styles.lightboxImage} resizeMode="contain" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 100 },
  card: {
    backgroundColor: Colors.light.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeaderLeft: { flex: 1 },
  judul: { fontSize: 20, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  kategori: { fontSize: 13, color: Colors.light.primary, fontWeight: '500' },
  deskripsi: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  infoLabel: { fontSize: 14, color: Colors.light.textMuted, fontWeight: '500' },
  infoValue: { fontSize: 14, color: Colors.light.text, flex: 1 },
  adminActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  approveButton: { backgroundColor: Colors.light.approved },
  pendingButton: { backgroundColor: Colors.light.pending },
  rejectButton: { backgroundColor: Colors.light.rejected },
  actionDisabled: { opacity: 0.4 },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  galleryItem: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    height: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  galleryImage: { width: '100%', height: '100%' },
  commentItem: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  commentInfo: { flex: 1 },
  commentName: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  commentDate: { fontSize: 11, color: Colors.light.textMuted },
  deleteCommentText: { color: Colors.light.destructive, fontSize: 13, fontWeight: '600' },
  commentContent: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: Spacing.sm,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: Spacing.lg },
  modalInput: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 100,
    marginBottom: Spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  modalCancelBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalCancelText: { color: Colors.light.textSecondary, fontWeight: '600' },
  modalConfirmBtn: {
    backgroundColor: Colors.light.destructive,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  modalConfirmDisabled: { opacity: 0.5 },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  lightbox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  lightboxImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 101,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseText: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 },
});
