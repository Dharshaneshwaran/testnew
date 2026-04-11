"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getProfile, type AuthResponse, type AuthUser } from "@/lib/api/auth";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/lib/api/client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  login: (payload: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        if (!active) {
          return;
        }

        setToken(null);
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      try {
        const profile = await getProfile(storedToken);
        if (!active) {
          return;
        }

        setToken(storedToken);
        setUser(profile);
        setStatus("authenticated");
      } catch {
        if (!active) {
          return;
        }

        clearAuthToken();
        setToken(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      clearAuthToken();
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== "tradeboard_access_token") {
        return;
      }

      const storedToken = getAuthToken();
      if (!storedToken) {
        handleUnauthorized();
      }
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      login(payload) {
        setAuthToken(payload.accessToken);
        setToken(payload.accessToken);
        setUser(payload.user);
        setStatus("authenticated");
      },
      logout() {
        clearAuthToken();
        setToken(null);
        setUser(null);
        setStatus("unauthenticated");
      },
    }),
    [status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
