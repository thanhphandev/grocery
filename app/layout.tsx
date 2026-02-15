import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap", // Improve font loading
});

export const metadata: Metadata = {
  title: "Tạp Hóa Kênh 3 - Phan Văn Thành",
  description: "Ứng dụng tra cứu giá sản phẩm siêu tốc cho nhân viên bán hàng. Quét mã vạch hoặc tìm kiếm theo tên.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tạp Hóa Kênh 3",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" richColors theme="system" closeButton />
      </body>
    </html>
  );
}
