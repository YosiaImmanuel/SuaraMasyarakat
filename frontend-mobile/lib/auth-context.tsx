import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { getProfile } from "./api";
import { initializeSocket, disconnectSocket, getSocket } from "./socket";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        if (!storedToken) {
          setIsLoading(false);
          return;
        }
        setToken(storedToken);
        initializeSocket(storedToken);
        const profile = await getProfile();
        setUser(profile);
      } catch {
        await SecureStore.deleteItemAsync("token");
        disconnectSocket();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync("token", newToken);
    initializeSocket(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    disconnectSocket();
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function getRoleDashboard(role: string): string {
  switch (role) {
    case "admin":
      return "/(admin)";
    case "super_admin":
      return "/(superadmin)";
    default:
      return "/(user)";
  }
}
