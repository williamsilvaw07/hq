"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, register as apiRegister, api } from "./api";

type User = { id: number; name: string; email: string; avatar_url?: string | null } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; avatar_url?: string | null }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setWorkspaceId: (id: number | null) => void;
  workspaceId: number | null;
};

const API_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
    : "";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [workspaceId, setWorkspaceIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    api<{ id: number; name: string; email: string; avatar_url?: string | null }>("/api/user")
      .then((r) => {
        if (r.data) setUser(r.data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    if (!data?.token || !data?.user) {
      throw new Error("Invalid login response. Check that the API returns { token, user }.");
    }
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    router.push("/dashboard");
  }, [router]);

  const register = useCallback(
    async (name: string, email: string, password: string, password_confirmation: string) => {
      const data = await apiRegister(name, email, password, password_confirmation);
      if (!data?.token || !data?.user) {
        throw new Error("Invalid register response. Check that the API returns { token, user }.");
      }
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setWorkspaceIdState(null);
    router.push("/login");
  }, [router]);

  const setWorkspaceId = useCallback((id: number | null) => {
    setWorkspaceIdState(id);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; email?: string; avatar_url?: string | null }) => {
    const res = await api<{ id: number; name: string; email: string; avatar_url?: string | null }>("/api/user", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (res.data) setUser(res.data);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/api/user/avatar`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    const json = (await res.json().catch(() => ({}))) as { data?: User; message?: string };
    if (!res.ok) throw new Error(json.message || "Upload failed");
    if (json.data) setUser(json.data);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await api<{ message?: string }>("/api/user/password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      }),
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        uploadAvatar,
        changePassword,
        setWorkspaceId,
        workspaceId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
