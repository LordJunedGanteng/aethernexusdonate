"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useAuth, clearAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/",          icon: "dashboard",          label: "Dashboard"  },
  { href: "/config",    icon: "hub",                label: "Platforms"  },
  { href: "/analytics", icon: "monitoring",         label: "Analytics"  },
  { href: "/stream",    icon: "videocam",           label: "Stream"     },
  { href: "/licenses",  icon: "vpn_key",            label: "Licenses"   },
];

const ADMIN_ITEM = { href: "/admin", icon: "admin_panel_settings", label: "Admin" };

const G = { fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif" };

export default function SideNav() {
  const path   = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  if (path === "/login") return null;

  const items = user?.role === "admin" ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-[48px] h-[calc(100vh-48px)] w-[240px] border-r border-zinc-800 bg-zinc-950 z-40">
        {/* Brand mark */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-zinc-800">
          <div className="w-9 h-9 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-300">
            <span className="material-symbols-outlined filled text-[20px]">terminal</span>
          </div>
          <div>
            <div className="font-black uppercase text-[10px] tracking-wider text-cyan-300" style={G}>
              AETHER NEXUS
            </div>
            <div className="text-zinc-500 text-[9px] tracking-widest font-mono">v2.0-STABLE</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {items.map(({ href, icon, label }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-r-sm transition-all duration-100",
                  "font-bold uppercase text-[11px] tracking-wider border-l-[3px]",
                  active
                    ? "text-cyan-300 border-cyan-300 bg-zinc-900/60 translate-x-0.5"
                    : "text-zinc-500 border-transparent hover:bg-zinc-900 hover:text-zinc-200"
                )}
                style={G}
              >
                <span className={clsx("material-symbols-outlined text-[20px]", active && "filled")}>
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-4 pb-5 space-y-2">
          {/* User info */}
          {user && (
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-cyan-300 uppercase">
                {user.username?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-300 text-[11px] font-bold truncate" style={G}>{user.username}</div>
                <div className="text-zinc-600 text-[9px] font-mono uppercase">{user.role}</div>
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-r-sm border-l-[3px] border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-error hover:border-error transition-all duration-100 font-bold uppercase text-[11px] tracking-wider"
            style={G}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>

          {/* System status */}
          <div className="bg-surface-container-high rounded p-2 border border-outline-variant flex items-center justify-between">
            <span className="text-on-surface-variant text-[10px] font-mono uppercase tracking-wider">System Status</span>
            <span className="w-2 h-2 rounded-full bg-primary-fixed shadow-[0_0_6px_#c8e9ec] animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-black/90 border-t border-zinc-800 flex justify-around items-center h-[56px]">
        {items.slice(0, 4).map(({ href, icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} className="flex items-center justify-center w-12 h-full">
              <span className={clsx(
                "material-symbols-outlined text-[22px] transition-colors",
                active ? "filled text-cyan-300 drop-shadow-[0_0_6px_rgba(200,233,236,0.7)]" : "text-zinc-500"
              )}>
                {icon}
              </span>
            </Link>
          );
        })}
        {/* Logout on mobile */}
        <button onClick={handleLogout} className="flex items-center justify-center w-12 h-full">
          <span className="material-symbols-outlined text-[22px] text-zinc-500 hover:text-error transition-colors">logout</span>
        </button>
      </nav>
    </>
  );
}
