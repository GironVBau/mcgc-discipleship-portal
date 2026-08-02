import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCGC Discipleship Portal",
  description: "Ministry of Christ's Great Commission Church Inc. Discipleship Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Global Footer */}
        <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-400 font-sans mt-auto">
          <p className="flex items-center justify-center space-x-1">
            <span>Designed &amp; Developed by</span>
            <span className="font-semibold text-slate-200">
              Viz Giron
            </span>
          </p>
        </footer>
      </body>
    </html>
  );
}