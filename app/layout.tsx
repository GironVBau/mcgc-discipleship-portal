import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"; // 1. Import your Footer component
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
  description:
    "Ministry of Christ's Great Commission Church Inc. Discipleship Portal for Standard On-boarding Process (S.O.P)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
        {/* Sticky Dynamic Glassmorphic Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* 2. Global Footer */}
        <Footer />
      </body>
    </html>
  );
}