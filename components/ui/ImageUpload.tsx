"use client";

/**
 * components/ui/ImageUpload.tsx
 * Component upload ảnh lên Cloudinary qua /api/upload.
 * Props:
 *   value      — URL hiện tại của ảnh (để preview)
 *   onChange   — callback khi upload xong, nhận URL mới
 *   folder     — Cloudinary folder (mặc định "projecthub/general")
 *   label      — nhãn hiển thị (tuỳ chọn)
 *   aspectRatio — "square" | "wide" | "cover" (giao diện preview)
 *   disabled   — vô hiệu input
 */

import { useRef, useState } from "react";

interface Props {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspectRatio?: "square" | "wide" | "cover";
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  folder = "projecthub/general",
  label,
  aspectRatio = "square",
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local object URL shown only while a file uploads; otherwise the preview follows `value`,
  // so a parent that fills `value` in after mount (async prefill) is reflected.
  const [blob, setBlob] = useState<string | null>(null);
  const preview = blob ?? (value || null);
  const [drag, setDrag] = useState(false);

  const previewClass =
    aspectRatio === "square"
      ? "w-24 h-24 rounded-full"
      : aspectRatio === "wide"
      ? "w-full h-36 rounded-xl"
      : "w-full h-48 rounded-xl";

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    setBlob(URL.createObjectURL(file));

    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload thất bại.");
      } else {
        onChange(json.url);
      }
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setBlob(null);
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    upload(files[0]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium text-slate-700">{label}</p>
      )}

      <div
        className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl transition-colors cursor-pointer
          ${drag ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"}
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${aspectRatio === "square" ? "p-4" : "p-3"}`}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        {/* Preview */}
        {preview ? (
          <div className={`${previewClass} overflow-hidden bg-slate-100 shrink-0`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`${previewClass} bg-slate-100 flex items-center justify-center shrink-0`}>
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Text */}
        <div className="text-center">
          {uploading ? (
            <p className="text-xs text-indigo-500 font-medium animate-pulse">Đang tải lên...</p>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                <span className="text-indigo-600 font-medium">Chọn ảnh</span> hoặc kéo thả vào đây
              </p>
              <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WebP — tối đa 5 MB</p>
            </>
          )}
        </div>

        {/* Remove button */}
        {preview && !uploading && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-2 right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
            title="Xoá ảnh"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
