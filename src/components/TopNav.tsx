"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function TopNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="fixed top-0 w-full h-[48px] z-50 bg-black/90 border-b border-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.5)] flex justify-between items-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span
          className="text-base font-black uppercase tracking-widest text-cyan-300 drop-shadow-[0_0_8px_rgba(200,233,236,0.8)] font-grotesk md:pl-[240px] transition-all"
          style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif" }}
        >
          Aether Nexus
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button className="text-zinc-500 hover:text-cyan-200 hover:drop-shadow-[0_0_5px_rgba(200,233,236,0.5)] transition-all w-8 h-8 flex items-center justify-center rounded-full">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        <button
          className="text-zinc-500 hover:text-cyan-200 hover:drop-shadow-[0_0_5px_rgba(200,233,236,0.5)] transition-all w-8 h-8 flex items-center justify-center rounded-full"
          onClick={() => router.push("/config")}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
        {user ? (
          <button
            onClick={logout}
            className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden flex items-center justify-center hover:border-cyan-300 transition-colors"
            title={`${user.username} — sign out`}
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
          </button>
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant" />
        )}
      </div>
    </nav>
  );
}
