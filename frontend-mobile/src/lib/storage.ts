import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

export const storage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },
  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  },
  async getUser<T>(): Promise<T | null> {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  async setUser<T>(user: T): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER);
  },
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TOKEN);
    await AsyncStorage.removeItem(KEYS.USER);
  },
};
