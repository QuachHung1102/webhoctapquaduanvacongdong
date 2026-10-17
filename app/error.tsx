"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center bg-white rounded-2xl ring-1 ring-slate-200/80 p-10">
        <h1 className="text-2xl font-bold text-slate-900">Đã có lỗi xảy ra</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Trang không tải được. Thử lại sau ít phút, nếu vẫn lỗi hãy báo cho chúng tôi kèm mã bên dưới.
        </p>
        {error.digest && <p className="mt-3 text-xs text-slate-400 font-mono">Mã lỗi: {error.digest}</p>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
          <Link href="/" className="px-6 py-2.5 rounded-xl font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
