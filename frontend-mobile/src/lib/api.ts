import { API_URL } from '@/src/constants/api';
import { storage } from './storage';

const TIMEOUT_MS = 10000;

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

async function getToken(): Promise<string | null> {
  return storage.getToken();
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function buildHeaders(token: string | null, options: ApiOptions): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function buildUrl(endpoint: string, params?: ApiOptions['params']): string {
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan');
  }
  return data as T;
}

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  const token = await getToken();
  const headers = await buildHeaders(token, options);
  const url = buildUrl(endpoint, params);

  try {
    const response = await fetchWithTimeout(url, { ...fetchOptions, headers });
    return handleResponse<T>(response);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Koneksi timeout. Periksa koneksi jaringan dan pastikan server aktif.');
    }
    if (err.message?.includes('Network request failed') || err.message?.includes('fetch')) {
      throw new Error('Tidak dapat terhubung ke server. Periksa:\n1. Pastikan server backend berjalan\n2. Periksa alamat IP di src/constants/api.ts\n3. Pastikan handphone dan komputer dalam jaringan yang sama');
    }
    throw err;
  }
}

export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<T>(response);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Koneksi timeout. Periksa koneksi jaringan.');
    }
    throw err;
  }
}

export async function apiUpdate<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: formData,
    });
    return handleResponse<T>(response);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Koneksi timeout. Periksa koneksi jaringan.');
    }
    throw err;
  }
}
