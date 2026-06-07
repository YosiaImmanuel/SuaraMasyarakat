export const Colors = {
  light: {
    // Brand
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',

    // Backgrounds
    background: '#faf8ff',
    surface: '#ffffff',
    card: '#ffffff',

    // Text
    text: '#11181C',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',

    // Status colors
    pending: '#f59e0b',
    pendingBg: '#fffbeb',
    approved: '#10b981',
    approvedBg: '#ecfdf5',
    rejected: '#ef4444',
    rejectedBg: '#fef2f2',

    // UI
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#2563eb',
    tint: '#2563eb',

    // Chat
    chatSent: '#0095f6',
    chatReceived: '#f0f0f0',

    // Destructive
    destructive: '#ef4444',
    destructiveBg: '#fef2f2',

    // Success
    success: '#10b981',
    successBg: '#ecfdf5',

    // Notification
    unreadBg: '#eff6ff',
  },
  dark: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',

    background: '#0f172a',
    surface: '#1e293b',
    card: '#1e293b',

    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',

    pending: '#fbbf24',
    pendingBg: '#1c1917',
    approved: '#34d399',
    approvedBg: '#052e16',
    rejected: '#f87171',
    rejectedBg: '#450a0a',

    border: '#334155',
    borderLight: '#1e293b',
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: '#3b82f6',
    tint: '#3b82f6',

    chatSent: '#2563eb',
    chatReceived: '#334155',

    destructive: '#ef4444',
    destructiveBg: '#450a0a',

    success: '#10b981',
    successBg: '#052e16',

    unreadBg: '#1e3a5f',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
