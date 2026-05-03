import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SideNav from "@/components/SideNav";
import TopNav from "@/components/TopNav";

const inter = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const interBody = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aether Nexus — F4R Services",
  description: "Donation stream integration dashboard for Roblox",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${interBody.variable} dark`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-background text-on-surface antialiased overflow-x-hidden">
        <TopNav />
        <SideNav />
        {/* Main content: offset for topnav (48px) and sidebar (240px on md+) */}
        <main className="md:pl-[240px] pt-[48px] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
