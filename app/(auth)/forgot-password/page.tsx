"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "email" | "answer" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // -- Bước 1: Nhập email → lấy câu hỏi bảo mật ----------------------------
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(
      `/api/auth/forgot-password?email=${encodeURIComponent(email.toLowerCase().trim())}`
    );
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Không tìm thấy tài khoản.");
      return;
    }

    setQuestion(data.question);
    setStep("answer");
  }

  // -- Bước 2: Trả lời câu hỏi + đặt mật khẩu mới --------------------------
  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, answer, newPassword }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Đặt lại mật khẩu thất bại.");
      return;
    }

    setStep("success");
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
        <p className="text-slate-400 mt-2 text-sm">Khôi phục mật khẩu</p>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">

        {/* -- Thành công -- */}
        {step === "success" && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Đặt lại thành công!</h2>
            <p className="text-slate-400 text-sm">Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium
                         hover:bg-indigo-500 transition"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* -- Bước 1: Email -- */}
        {step === "email" && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Quên mật khẩu?</h1>
            <p className="text-slate-400 text-sm mb-6">
              Nhập email của bạn để lấy câu hỏi bảo mật.
            </p>

            {error && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Email tài khoản</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium
                           hover:bg-indigo-500 disabled:opacity-60 transition"
              >
                {loading ? "Đang kiểm tra..." : "Tiếp tục"}
              </button>
            </form>
          </>
        )}

        {/* -- Bước 2: Câu hỏi + mật khẩu mới -- */}
        {step === "answer" && (
          <>
            <h1 className="text-xl font-semibold text-white mb-2">Xác minh danh tính</h1>
            <p className="text-slate-400 text-sm mb-6">
              Trả lời câu hỏi bảo mật và nhập mật khẩu mới.
            </p>

            {error && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              {/* Câu hỏi */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-400/20">
                <p className="text-xs text-indigo-200 mb-1">Câu hỏi bảo mật</p>
                <p className="text-white text-sm font-medium">{question}</p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Câu trả lời</label>
                <input
                  type="text"
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Nhập câu trả lời"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 8 ký tự, có chữ hoa và số"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500
                                 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500
                                 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition text-sm"
                >
                  ← Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium
                             hover:bg-indigo-500 disabled:opacity-60 transition"
                >
                  {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>
              </div>
            </form>
          </>
        )}

        {step !== "success" && (
          <p className="mt-6 text-center text-sm text-slate-400">
            Nhớ mật khẩu rồi?{" "}
            <Link href="/login" className="text-indigo-300 hover:text-indigo-200 font-medium transition">
              Đăng nhập
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
