import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Inter is the standard system-quality sans-serif available in next/font since v13
const inter = Inter({
  variable: "--font-geist-sans", // keep CSS var name so tailwind.config picks it up unchanged
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono as the code/mono font — available in Next.js 14
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "MosqueConnect", template: "%s | MosqueConnect" },
  description:
    "Connect with your mosque — ask questions, get answers, and book council sessions with the imam.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
