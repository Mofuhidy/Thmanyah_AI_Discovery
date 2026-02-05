import type { Metadata } from "next";
import { Readex_Pro } from "next/font/google";
import "./globals.css";

const readexPro = Readex_Pro({
  variable: "--font-readex-pro",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "Thamanya AI Discovery",
  description: "Semantic search engine for Thamanya Podcast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${readexPro.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
