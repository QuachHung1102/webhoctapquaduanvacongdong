"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ImageUpload from "@/components/ui/ImageUpload";

interface FormData {
  name: string;
  bio: string;
  avatarUrl: string;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ name: "", bio: "", avatarUrl: "" });
  // Avatar as stored on the server; null until the profile has loaded.
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null);
  const loaded = savedAvatar !== null;

  // Prefill from the database, not the JWT: the token has no bio and can be stale.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/me")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Không tải được hồ sơ.");
          return;
        }
        setForm({ name: data.name ?? "", bio: data.bio ?? "", avatarUrl: data.avatarUrl ?? "" });
        setSavedAvatar(data.avatarUrl ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("Không thể kết nối tới máy chủ.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Tên không được để trống.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            bio: form.bio.trim(), // "" clears the bio
            // Only sent when it changed, so an untouched avatar is never overwritten.
            ...(form.avatarUrl !== savedAvatar && { avatarUrl: form.avatarUrl }),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Có lỗi xảy ra.");
          return;
        }

        // Refresh the session token so the sidebar/navbar show the new name and avatar
        await update({ name: form.name.trim(), avatarUrl: form.avatarUrl });
        router.push("/dashboard/profile");
        router.refresh();
      } catch {
        setError("Không thể kết nối tới máy chủ.");
      }
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa hồ sơ</h1>
        <p className="text-sm text-slate-500 mt-1">Cập nhật tên hiển thị và giới thiệu bản thân.</p>
      </div>

      <form onSubmit={handleSubmit} aria-busy={!loaded} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-5">
        {/* Avatar */}
        <ImageUpload
          label="Ảnh đại diện"
          value={form.avatarUrl}
          onChange={(url) => setForm((prev) => ({ ...prev, avatarUrl: url }))}
          folder="projecthub/avatars"
          aspectRatio="square"
          disabled={isPending || !loaded}
        />

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Tên hiển thị <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={!loaded}
            value={form.name}
            onChange={handleChange}
            maxLength={80}
            placeholder="Họ và tên của bạn"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1.5">
            Giới thiệu
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            disabled={!loaded}
            value={form.bio}
            onChange={handleChange}
            maxLength={500}
            placeholder="Kể về bản thân, kinh nghiệm và mục tiêu học tập của bạn..."
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">{form.bio.length}/500</p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending || !loaded}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {!loaded ? "Đang tải..." : isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
}
