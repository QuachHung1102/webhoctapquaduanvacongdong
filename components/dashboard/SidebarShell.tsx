"use client";

import { useEffect, useState } from "react";

interface Props {
  brand: React.ReactNode;
  widthClass?: string;
  children: React.ReactNode;
}

/**
 * Navy sidebar frame shared by /dashboard and /admin.
 * From `lg` up it is a static column; below `lg` it is an off-canvas drawer opened from a top bar.
 */
export default function SidebarShell({ brand, widthClass = "w-64", children }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between pl-4 pr-1.5 bg-slate-900 text-white">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở menu"
          aria-expanded={open}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        // Any link inside the drawer navigates, so a click on one closes it.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col ${widthClass} max-w-[85vw] overflow-y-auto bg-slate-900 text-white transition-transform duration-200 lg:static lg:z-auto lg:shrink-0 lg:min-h-screen lg:translate-x-0 lg:visible ${
          open ? "translate-x-0" : "-translate-x-full invisible"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Đóng menu"
          className="lg:hidden absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </aside>
    </>
  );
}
