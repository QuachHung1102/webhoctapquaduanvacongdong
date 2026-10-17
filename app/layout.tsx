import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";

// Be Vietnam Pro ships a `vietnamese` subset; Geist does not, so diacritics fell back to a system font.
const brandSans = Be_Vietnam_Pro({
  variable: "--font-brand",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Nền tảng học tập qua dự án thực tế. Tham gia dự án có Mentor đồng hành, làm việc nhóm theo sprint và xây dựng portfolio của riêng bạn.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ProjectHub — Học tập qua Dự án Thực tế",
  description,
  openGraph: {
    title: "ProjectHub — Học tập qua Dự án Thực tế",
    description,
    images: ["/images/hero/learners.jpg"],
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className={`${brandSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:bg-white focus:text-indigo-700 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
          Bỏ qua, tới nội dung chính
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
