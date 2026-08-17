import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  title: {
    default: "MCGC Discipleship System",
    template: "%s | MCGC Discipleship System",
  },
  description:
    "An original discipleship framework developed for MCGC, providing a structured and intentional progression of biblical instruction for every member.",
  applicationName: "MCGC Discipleship System",
  keywords: [
    "MCGC",
    "MCGC Discipleship System",
    "discipleship",
    "Christian discipleship",
    "biblical education",
    "Standard On-boarding Process",
    "SOP",
    "Ministry of Christ's Great Commission Church",
  ],
  authors: [
    {
      name: "Ministry of Christ's Great Commission Church Inc.",
    },
  ],
  creator: "Ministry of Christ's Great Commission Church Inc.",
  publisher: "Ministry of Christ's Great Commission Church Inc.",
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
        {/* Global Navigation */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}