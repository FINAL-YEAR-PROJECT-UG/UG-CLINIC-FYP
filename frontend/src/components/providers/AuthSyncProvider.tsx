"use client";

import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/authStore";
import { isStaffRole } from "@/lib/utils";
import { useEffect } from "react";

export default function AuthSyncProvider() {
  const { data: session, status } = useSession();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    // On initial load, clear any persisted auth until next-auth confirms
    if (status === "loading") {
      setLoading(true);
    } else if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      setAuth(user, {
        accessToken: session.accessToken as string,
        refreshToken: session.refreshToken as string,
      });
      setLoading(false);
    } else if (status === "unauthenticated") {
      const snap = useAuthStore.getState();
      const keepStaffSession =
        snap.isAuthenticated &&
        snap.user &&
        isStaffRole(snap.user.role);
      if (!keepStaffSession) {
        clearAuth();
      }
      setLoading(false);
    }
  }, [session, status, setAuth, clearAuth, setLoading]);

  return null;
}
