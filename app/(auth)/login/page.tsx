"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Seeded demo accounts — offered as one-click fill in development only, never in a production build.
const DEMO_ACCOUNTS =
  process.env.NODE_ENV === "production"
    ? []
    : [
        { label: "Học viên", email: "learner.hoa@projecthub.vn", password: "Demo@1234" },
        { label: "Mentor", email: "mentor.hung@projecthub.vn", password: "Demo@1234" },
        { label: "Quản trị", email: "admin@projecthub.vn", password: "Admin@1234" },
      ];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only same-site paths: "/x" yes, "//evil.com" and "https://…" no (open redirect).
  const requested = searchParams.get("callbackUrl") ?? "";
  const callbackUrl = /^\/(?![/\\])/.test(requested) ? requested : "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email hoặc mật khẩu không đúng.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-2xl font-bold text-white">ProjectHub</span>
        </Link>
        <p className="text-slate-400 mt-2 text-sm">Đăng nhập để tiếp tục</p>
      </div>

      {/* Card */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <h1 className="text-xl font-semibold text-white mb-6">Chào mừng trở lại</h1>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm text-slate-300 mb-1.5">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 placeholder:opacity-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="text-sm text-slate-300">Mật khẩu</label>
              <Link href="/forgot-password" className="text-xs text-indigo-300 hover:text-indigo-200 transition">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 placeholder:opacity-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium
                       hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {DEMO_ACCOUNTS.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-slate-400 mb-2.5">Tài khoản demo (chỉ hiện ở môi trường dev)</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setForm({ email: acc.email, password: acc.password })}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-indigo-300 hover:text-indigo-200 font-medium transition">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
