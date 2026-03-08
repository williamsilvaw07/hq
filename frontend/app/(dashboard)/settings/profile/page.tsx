"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Camera, ChevronRight, Trash2, X } from "lucide-react";

const API_URL =
  typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") : "";

export default function SettingsProfilePage() {
  const { user, updateProfile, uploadAvatar, changePassword } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user?.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setError("");
    try {
      await uploadAvatar(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-10 font-sans tracking-tight">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-card text-foreground transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Profile Info</h1>
        </div>
        <button
          type="submit"
          form="profile-form"
          disabled={saving}
          className="text-sm font-bold text-primary disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </header>
      <main className="px-6 space-y-8 pt-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={avatarUploading}
              className="relative w-28 h-28 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-foreground shadow-2xl overflow-hidden active:scale-95 transition-all"
              aria-label="Change photo"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url.startsWith("http") ? user.avatar_url : `${API_URL}${user.avatar_url}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-4 border-card active:scale-90 transition-all shadow-lg"
              aria-label="Change photo"
            >
              {avatarUploading ? (
                <span className="text-xs">…</span>
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="label">Tap to change avatar</p>
        </div>
        {error && (
          <p className="text-sm text-chart-2 bg-chart-2/10 border border-chart-2/20 rounded-xl p-3">
            {error}
          </p>
        )}
        <form id="profile-form" onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="label ml-1 block">Full Name</label>
            <div className="bg-card rounded-2xl p-4 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="label ml-1 block">Email Address</label>
            <div className="bg-card rounded-2xl p-4 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="label ml-1 block">Phone Number (WhatsApp)</label>
            <div className="bg-card rounded-2xl p-4 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-chart-1 text-lg" aria-hidden>●</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-foreground"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/60 italic ml-1">
              Used for syncing WhatsApp transactions
            </p>
          </div>
        </form>
        <div className="pt-8 space-y-4">
          <h3 className="section-title px-1">Privacy & Security</h3>
          <div className="bg-card rounded-3xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <span className="text-sm font-bold">Change Password</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-destructive"
            >
              <span className="text-sm font-bold">Delete Account</span>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Change Password</h3>
              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); setPasswordError(""); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label block mb-2">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="label block mb-2">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label block mb-2">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-background rounded-xl border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  autoComplete="new-password"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-chart-2">{passwordError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
                >
                  {changingPassword ? "Saving…" : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
