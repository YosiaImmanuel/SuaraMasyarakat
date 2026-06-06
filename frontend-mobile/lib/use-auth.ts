import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth, getRoleDashboard } from "./auth-context";

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!token || !user) {
      router.replace("/(auth)/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const correctRoute = getRoleDashboard(user.role);
      router.replace(correctRoute as any);
      return;
    }
  }, [isLoading, token, user, allowedRoles]);

  return { user, token, isLoading };
}
