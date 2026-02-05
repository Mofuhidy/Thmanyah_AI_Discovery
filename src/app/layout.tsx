import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google"; // Updated Font
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "لحظة | Lahza",
  description: "محرك بحث دلالي في أرشيف ثمانية. ابحث عن الفكرة، لا الحلقة.",
  icons: {
    icon: "/lahza.ico",
    shortcut: "/lahza.ico",
    apple: "/lahza.ico",
  },
  openGraph: {
    title: "لحظة | Lahza",
    description: "محرك بحث دلالي في أرشيف ثمانية. ابحث عن الفكرة، لا الحلقة.",
    siteName: "Lahza",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 800,
        height: 600,
        alt: "Lahza Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "لحظة | Lahza",
    description: "لا تبحث عن الحلقة.. ابحث عن الفكرة",
    images: ["/icon.png"],
  },
  keywords: [
    "ثمانية",
    "بودكاست",
    "بحث",
    "دلالي",
    "AI",
    "Thmanyah",
    "Podcast",
    "Search",
    "Lahza",
  ],
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
