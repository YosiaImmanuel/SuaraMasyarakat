import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/api";

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("token");
  } catch {
    return null;
  }
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

// ─── AUTH ────────────────────────────────────────────────
export async function loginAPI(email: string, password: string) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { res, data: await res.json() };
}

export async function registerAPI(nama: string, email: string, password: string) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nama, email, password }),
  });
  return { res, data: await res.json() };
}

export async function getProfile() {
  const res = await apiFetch("/auth/profile");
  if (!res.ok) throw new Error("Token tidak valid");
  return res.json();
}

export async function updateProfileAPI(data: {
  nama: string;
  email: string;
  password?: string;
  current_password?: string;
}) {
  const res = await apiFetch("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return { res, data: await res.json() };
}

export async function deleteAccountAPI(password: string) {
  const res = await apiFetch("/auth/account", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
  return { res, data: await res.json() };
}

// ─── LAPORAN ─────────────────────────────────────────────
export async function fetchLaporan(params?: {
  status?: string;
  category_id?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category_id) query.set("category_id", params.category_id);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiFetch(`/laporan${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Gagal mengambil data laporan");
  return res.json();
}

export async function fetchLaporanById(id: number | string) {
  const res = await apiFetch(`/laporan/${id}`);
  if (!res.ok) throw new Error("Laporan tidak ditemukan");
  return res.json();
}

export async function createLaporan(formData: FormData) {
  const res = await apiFetch("/laporan", {
    method: "POST",
    body: formData,
  });
  return { res, data: await res.json() };
}

export async function updateLaporan(id: number | string, formData: FormData) {
  const res = await apiFetch(`/laporan/${id}`, {
    method: "PUT",
    body: formData,
  });
  return { res, data: await res.json() };
}

export async function updateLaporanStatus(
  id: number | string,
  status: "pending" | "approved" | "rejected",
  rejection_reason?: string
) {
  const res = await apiFetch(`/laporan/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejection_reason }),
  });
  return { res, data: await res.json() };
}

export async function deleteLaporan(id: number | string) {
  const res = await apiFetch(`/laporan/${id}`, { method: "DELETE" });
  return { res, data: await res.json() };
}

// ─── COMMENTS ────────────────────────────────────────────
export async function fetchComments(laporanId: number | string) {
  const res = await apiFetch(`/comments/laporan/${laporanId}`);
  if (!res.ok) throw new Error("Gagal mengambil komentar");
  return res.json();
}

export async function createComment(laporan_id: number | string, isi: string) {
  const res = await apiFetch("/comments", {
    method: "POST",
    body: JSON.stringify({ laporan_id, isi }),
  });
  return { res, data: await res.json() };
}

export async function deleteComment(id: number | string) {
  const res = await apiFetch(`/comments/${id}`, { method: "DELETE" });
  return { res, data: await res.json() };
}

// ─── USERS (Super Admin) ─────────────────────────────────
export async function fetchUsers() {
  const res = await apiFetch("/users");
  if (!res.ok) throw new Error("Gagal mengambil data user");
  return res.json();
}

export async function fetchUserById(id: number | string) {
  const res = await apiFetch(`/users/${id}`);
  if (!res.ok) throw new Error("User tidak ditemukan");
  return res.json();
}

export async function createUser(data: {
  nama: string;
  email: string;
  password: string;
  role?: string;
}) {
  const res = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { res, data: await res.json() };
}

export async function updateUser(
  id: number | string,
  data: { nama?: string; email?: string; password?: string; role?: string }
) {
  const res = await apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return { res, data: await res.json() };
}

export async function deleteUser(id: number | string) {
  const res = await apiFetch(`/users/${id}`, { method: "DELETE" });
  return { res, data: await res.json() };
}

// ─── CATEGORIES ──────────────────────────────────────────
export async function fetchCategories() {
  const res = await apiFetch("/categories");
  if (!res.ok) throw new Error("Gagal mengambil data kategori");
  return res.json();
}

export async function createCategory(nama: string) {
  const res = await apiFetch("/categories", {
    method: "POST",
    body: JSON.stringify({ nama }),
  });
  return { res, data: await res.json() };
}

export async function updateCategory(id: number | string, nama: string) {
  const res = await apiFetch(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ nama }),
  });
  return { res, data: await res.json() };
}

export async function deleteCategory(id: number | string) {
  const res = await apiFetch(`/categories/${id}`, { method: "DELETE" });
  return { res, data: await res.json() };
}

// ─── CHAT ────────────────────────────────────────────────
export async function getChatUsers() {
  const res = await apiFetch("/chat/users");
  if (!res.ok) throw new Error("Gagal mengambil data user");
  return res.json();
}

export async function searchChatUsers(query: string) {
  const res = await apiFetch(`/chat/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Gagal mencari user");
  return res.json();
}

export async function getChatHistory(receiverId: number | string) {
  const res = await apiFetch(`/chat/history/${receiverId}`);
  if (!res.ok) throw new Error("Gagal mengambil riwayat chat");
  return res.json();
}

export async function getConversations() {
  const res = await apiFetch("/chat/conversations");
  if (!res.ok) throw new Error("Gagal mengambil percakapan");
  return res.json();
}

// ─── NOTIFICATIONS ───────────────────────────────────────
export async function fetchNotifications() {
  const res = await apiFetch("/notifications");
  if (!res.ok) throw new Error("Gagal mengambil data notifikasi");
  return res.json();
}

export async function fetchUnreadNotificationsCount() {
  const res = await apiFetch("/notifications/unread-count");
  if (!res.ok) throw new Error("Gagal mengambil jumlah notifikasi baru");
  return res.json();
}

export async function markNotificationsAsRead() {
  const res = await apiFetch("/notifications/read", { method: "PATCH" });
  if (!res.ok) throw new Error("Gagal menandai notifikasi dibaca");
  return res.json();
}

export async function markNotificationAsReadById(id: number | string) {
  const res = await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
  if (!res.ok) throw new Error("Gagal menandai notifikasi dibaca");
  return res.json();
}
