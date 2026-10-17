"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SECURITY_QUESTIONS } from "@/constants/auth";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  securityQuestion: string;
  securityAnswer: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (!form.securityAnswer.trim()) {
      setError("Vui lòng nhập câu trả lời bảo mật.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:             form.name.trim(),
        email:            form.email.toLowerCase().trim(),
        password:         form.password,
        securityQuestion: form.securityQuestion,
        securityAnswer:   form.securityAnswer,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Đăng ký thất bại.");
      setLoading(false);
      return;
    }

    // Tự động đăng nhập sau khi đăng ký thành công
    await signIn("credentials", {
      email:    form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-2xl font-bold text-white">ProjectHub</span>
        </Link>
        <p className="text-slate-400 mt-2 text-sm">Tạo tài khoản để bắt đầu học qua dự án</p>
      </div>

      {/* Card */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <h1 className="text-xl font-semibold text-white mb-6">Tạo tài khoản mới</h1>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ tên */}
          <div>
            <label htmlFor="register-name" className="block text-sm text-slate-300 mb-1.5">Họ và tên</label>
            <input
              id="register-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 placeholder:opacity-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="register-email" className="block text-sm text-slate-300 mb-1.5">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 placeholder:opacity-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          {/* Mật khẩu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="register-password" className="block text-sm text-slate-300 mb-1.5">Mật khẩu</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 placeholder:opacity-100
                           focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="register-confirm-password" className="block text-sm text-slate-300 mb-1.5">Xác nhận</label>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 placeholder:opacity-100
                           focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Câu hỏi bảo mật */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-slate-400 mb-3">
              Câu hỏi bảo mật — dùng để lấy lại mật khẩu nếu quên
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="register-question" className="block text-sm text-slate-300 mb-1.5">Chọn câu hỏi</label>
                <select
                  id="register-question"
                  value={form.securityQuestion}
                  onChange={(e) => set("securityQuestion", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="register-answer" className="block text-sm text-slate-300 mb-1.5">Câu trả lời</label>
                <input
                  id="register-answer"
                  type="text"
                  required
                  value={form.securityAnswer}
                  onChange={(e) => set("securityAnswer", e.target.value)}
                  placeholder="Nhập câu trả lời (không phân biệt hoa thường)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 placeholder:opacity-100
                             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium
                       hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition mt-2"
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-indigo-300 hover:text-indigo-200 font-medium transition">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
