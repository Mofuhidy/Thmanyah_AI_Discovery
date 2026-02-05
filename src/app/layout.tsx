import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google"; // Updated Font
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
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
      <body className={`${ibmPlexSansArabic.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
