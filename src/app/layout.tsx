import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Trteel Audio Sync",
  description: "Create customized Quran videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${cairo.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
