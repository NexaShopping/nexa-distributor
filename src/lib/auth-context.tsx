"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { tokenStore } from "./auth-store";
import type { AuthAccount, MeResponse, OtpVerifyResponse } from "./types";

type Status = "loading" | "authed" | "anon";

interface AuthContextValue {
  status: Status;
  account: AuthAccount | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initial state (not a setState-in-effect) so the no-token case never renders
  // "loading" at all — only the token-present case needs the effect's async round trip.
  const [status, setStatus] = useState<Status>(() => (tokenStore.get() ? "loading" : "anon"));
  const [account, setAccount] = useState<AuthAccount | null>(null);

  // On load, if we hold a token, ask the server who we are. A bad/expired token
  // is cleared and we fall back to signed-out.
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get<MeResponse>("/auth/me")
      .then((data) => {
        setAccount(data.account);
        setStatus("authed");
      })
      .catch(() => {
        tokenStore.clear();
        setAccount(null);
        setStatus("anon");
      });
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    await api.post("/auth/otp/request", { phone });
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const result = await api.post<OtpVerifyResponse>("/auth/otp/verify", { phone, otp });
    tokenStore.set(result.token);
    setAccount(result.account);
    setStatus("authed");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* revoking the session is best-effort; clear locally regardless */
    }
    tokenStore.clear();
    setAccount(null);
    setStatus("anon");
  }, []);

  return (
    <AuthContext.Provider value={{ status, account, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
