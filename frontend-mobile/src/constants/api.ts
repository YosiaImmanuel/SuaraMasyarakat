import { Platform } from 'react-native';

/**
 * ⚠️ UBAH IP INI dengan alamat IP komputer tempat backend berjalan.
 * 
 * Cara cek IP komputer:
 * - Windows: buka CMD, ketik `ipconfig`, cari IPv4 Address
 * - Mac/Linux: buka terminal, ketik `ifconfig` atau `ip addr`
 * 
 * Pastikan handphone dan komputer terhubung ke jaringan WiFi yang SAMA.
 * Port 3000 harus sesuai dengan PORT di backend/.env
 */
const COMPUTER_IP = '192.168.0.13';
const PORT = '3000';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}`;
  }
  return `http://${COMPUTER_IP}:${PORT}`;
};

export const API_BASE_URL = getBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    DELETE_ACCOUNT: '/auth/account',
  },
  LAPORAN: {
    LIST: '/laporan',
    DETAIL: (id: number) => `/laporan/${id}`,
    CREATE: '/laporan',
    UPDATE: (id: number) => `/laporan/${id}`,
    DELETE: (id: number) => `/laporan/${id}`,
    STATUS: (id: number) => `/laporan/${id}/status`,
  },
  COMMENTS: {
    LIST: (laporanId: number) => `/comments/laporan/${laporanId}`,
    CREATE: '/comments',
    DELETE: (id: number) => `/comments/${id}`,
  },
  CATEGORIES: {
    LIST: '/categories',
    CREATE: '/categories',
    UPDATE: (id: number) => `/categories/${id}`,
    DELETE: (id: number) => `/categories/${id}`,
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id: number) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: number) => `/users/${id}`,
    DELETE: (id: number) => `/users/${id}`,
  },
  CHAT: {
    USERS: '/chat/users',
    SEARCH: '/chat/search',
    CONVERSATIONS: '/chat/conversations',
    HISTORY: (receiverId: number) => `/chat/history/${receiverId}`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_ALL_READ: '/notifications/read',
    MARK_READ: (id: number) => `/notifications/${id}/read`,
  },
};
