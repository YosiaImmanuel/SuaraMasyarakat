export type Role = 'user' | 'admin' | 'super_admin';

export type LaporanStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Laporan {
  id: number;
  user_id: number;
  category_id: number;
  judul: string;
  deskripsi: string;
  lokasi: string | null;
  gambar: string | null;
  status: LaporanStatus;
  created_at: string;
  updated_at: string;
  nama_pelapor?: string;
  kategori?: string;
}

export interface Category {
  id: number;
  nama: string;
  created_at?: string;
}

export interface Comment {
  id: number;
  laporan_id: number;
  user_id: number;
  isi: string;
  created_at: string;
  nama_user?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export interface Conversation {
  user_id: number;
  nama: string;
  role: Role;
  last_message: string;
  last_message_time: string;
  unread?: number;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  reference_id: number | null;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  total_users?: number;
  total_admins?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
