import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/shared/toast-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SI-Tahfiz — Sistem Informasi Manajemen Tahfiz",
  description: "Aplikasi Manajemen Program Tahfiz Al-Qur'an MTs TQ Jamilurrahman Yogyakarta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} antialiased bg-white text-[#111827]`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
