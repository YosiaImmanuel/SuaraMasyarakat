export interface User {
  id: number;
  nama: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  created_at: string;
}

export interface Laporan {
  id: number;
  user_id: number;
  category_id: number;
  judul: string;
  deskripsi: string;
  lokasi: string;
  gambar: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  nama_pelapor?: string;
  kategori?: string;
}

export interface Comment {
  id: number;
  laporan_id: number;
  user_id: number;
  isi: string;
  created_at: string;
  nama_user?: string;
}

export interface Category {
  id: number;
  nama: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export interface ChatUser {
  id: number;
  nama: string;
  email: string;
  role: string;
  last_message?: string;
  last_message_time?: string;
}

export interface Conversation {
  user: ChatUser;
  last_message: string;
  last_message_time: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  reference_id: number;
  created_at: string;
}
