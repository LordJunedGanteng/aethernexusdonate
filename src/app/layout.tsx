import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import LicenseGate from "@/components/LicenseGate";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Ethereal Command",
  description: "Roblox Donation Integration Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} dark`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-surface text-on-surface min-h-dvh pb-24">
        {/* Ambient background glows */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] rounded-full blur-[120px]" style={{ background: "rgba(174,198,255,0.07)" }} />
          <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] rounded-full blur-[120px]" style={{ background: "rgba(210,187,255,0.06)" }} />
        </div>

        {/* Top header */}
        <header className="fixed top-0 w-full flex justify-between items-center px-6 py-4 z-40"
          style={{ background: "rgba(11,19,38,0.7)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">hub</span>
            <h1 className="text-xl font-extrabold font-headline tracking-tight bg-gradient-to-br from-primary to-primary-container bg-clip-text text-transparent">
              The Ethereal Command
            </h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
          </div>
        </header>

        <main className="pt-20">
          <LicenseGate>{children}</LicenseGate>
        </main>

        <BottomNav />
      </body>
    </html>
  );
}
