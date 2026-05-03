"use client";
import { useEffect, useState, useCallback } from "react";
import {
  api, formatRp, PLATFORM_LABEL,
  type Donation, type LeaderboardEntry, type StatsResponse, type RobloxGameInfo,
} from "@/lib/api";
import { getLicenseKey, useAuth } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";
import clsx from "clsx";

const PLATFORM_BADGE: Record<string, string> = {
  saweria:    "text-primary-fixed border-primary-fixed/30",
  socialbuzz: "text-secondary border-secondary/30",
  bagibagi:   "text-tertiary-fixed-dim border-tertiary-fixed/40",
  trakteer:   "text-error border-error/30",
  twitch:     "text-purple-400 border-purple-400/30",
};

const GROTESK = { fontFamily: "var(--font-space-grotesk,'Space Grotesk'),sans-serif" };

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  return <AuthGate><Dashboard /></AuthGate>;
}

function Dashboard() {
  const { user } = useAuth();
  const licenseKey = getLicenseKey();

  const [stats,     setStats]     = useState<StatsResponse | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [leaders,   setLeaders]   = useState<LeaderboardEntry[]>([]);
  const [game,      setGame]      = useState<RobloxGameInfo | null>(null);
  const [tab,       setTab]       = useState<"today"|"week"|"alltime">("today");
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!licenseKey) return;
    try {
      const [s, d, lb, g] = await Promise.allSettled([
        api.donations.stats(licenseKey),
        api.donations.recent(licenseKey, 8),
        api.leaderboard(licenseKey, "today"),
        api.roblox.game(licenseKey),
      ]);
      if (s.status  === "fulfilled") setStats(s.value);
      if (d.status  === "fulfilled") setDonations(d.value.donations);
      if (lb.status === "fulfilled") setLeaders(lb.value.leaderboard);
      if (g.status  === "fulfilled") setGame(g.value);
    } finally { setLoading(false); }
  }, [licenseKey]);

  useEffect(() => { load(); }, [load]);

  const loadLeaders = async (tf: "today"|"week"|"alltime") => {
    if (!licenseKey) return;
    setTab(tf);
    const r = await api.leaderboard(licenseKey, tf).catch(() => null);
    if (r) setLeaders(r.leaderboard);
  };

  const totals = (stats as any)?.totals;

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6 pb-20 md:pb-8">

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-surface-container-high pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-primary tracking-tight leading-tight" style={GROTESK}>
            Selamat datang,{" "}
            <span className="text-primary-fixed">{user?.username ?? "Commander"}</span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">Real-time telemetry and signal processing active.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-surface-container border border-outline-variant px-3 py-1.5 rounded cyber-glow">
          <span className="material-symbols-outlined text-primary-fixed text-[16px]">verified_user</span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary-fixed">
            {licenseKey?.slice(0, 20) ?? "NO LICENSE"}
          </span>
        </div>
      </header>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Stat Cards 2×2 */}
        <div className="col-span-12 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: "Total Donated",      value: totals ? formatRp(totals.total ?? 0) : "—", sub: "Cumulative volume",  icon: "account_balance_wallet", accent: "text-primary-fixed" },
            { label: "Signals Received",   value: totals ? String(totals.count ?? 0)   : "—", sub: "+8.4% velocity",      icon: "wifi_tethering",         accent: "text-secondary"     },
            { label: "Unique Commanders",  value: totals ? String(totals.unique_donors ?? 0) : "—", sub: "Distinct donors", icon: "group",               accent: "text-outline"       },
            { label: "Avg Yield",          value: totals ? formatRp(Math.round(totals.avg ?? 0)) : "—", sub: "Stable telemetry", icon: "data_exploration", accent: "text-primary-fixed" },
          ].map(({ label, value, sub, icon, accent }) => (
            <div key={label} className="bg-surface-container border border-outline-variant rounded-lg p-6 relative overflow-hidden group cyber-border-hover transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary-container opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity" />
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={GROTESK}>{label}</h3>
                <span className={clsx("material-symbols-outlined text-[18px]", accent)}>{icon}</span>
              </div>
              <div className="text-[42px] font-black text-primary tracking-tighter leading-none" style={GROTESK}>{value}</div>
              <div className="flex items-center gap-1 mt-2 text-primary-fixed text-[10px] font-semibold">
                <span className="material-symbols-outlined text-[13px]">trending_up</span>
                <span>{sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Game Preview */}
        <div className="col-span-12 xl:col-span-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden relative h-full min-h-[260px] group">
            {game?.thumbnailUrl ? (
              <img src={game.thumbnailUrl} alt="Game" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(200,233,236,0.08),transparent_70%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/40 to-transparent" />
            <div className="absolute top-3 left-3 bg-surface-container-high/80 backdrop-blur border border-primary-fixed px-2 py-1 rounded flex items-center gap-1.5 cyber-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed shadow-[0_0_5px_#c8e9ec] animate-pulse" />
              <span className="text-primary-fixed text-[9px] font-bold uppercase tracking-wider">Live Link</span>
            </div>
            <div className="absolute bottom-0 w-full p-4">
              <h2 className="text-base font-bold text-primary mb-1.5 drop-shadow-md" style={GROTESK}>
                {game?.name ?? "Roblox Game"}
              </h2>
              <div className="flex items-center gap-3 text-on-surface-variant text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  <span>{game?.playing ?? 0} playing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Trend Chart */}
        <div className="col-span-12 xl:col-span-8 bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col min-h-[280px] cyber-border-hover transition-all">
          <div className="flex justify-between items-center mb-5 border-b border-surface-container-high pb-3">
            <h3 className="text-base font-semibold text-primary uppercase tracking-wide" style={GROTESK}>
              Signal Frequency Matrix{" "}
              <span className="text-on-surface-variant text-[10px] normal-case tracking-normal font-normal ml-1">(7 Days)</span>
            </h3>
          </div>
          <div className="flex-1 relative w-full">
            <div className="absolute inset-0 flex items-end">
              <div className="w-full h-[85%]">
                <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(200,233,236,0.25)]" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%"   stopColor="#c8e9ec" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#c8e9ec" stopOpacity="0"   />
                    </linearGradient>
                  </defs>
                  {(stats as any)?.by_day?.length > 1 ? (() => {
                    const days: {total:number}[] = (stats as any).by_day;
                    const max = Math.max(...days.map(d => d.total), 1);
                    const pts = days.map((d, i) => `${(i/(days.length-1))*100},${100-(d.total/max)*90}`);
                    return (<>
                      <path d={`M0,100 L${pts.join(" L")} L100,100 Z`} fill="url(#cg)" />
                      <path d={`M${pts.join(" L")}`}                   fill="none" stroke="#c8e9ec" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </>);
                  })() : (
                    <>
                      <path d="M0,100 L0,70 Q10,60 20,80 T40,50 T60,30 T80,40 T100,10 L100,100 Z" fill="url(#cg)" />
                      <path d="M0,70 Q10,60 20,80 T40,50 T60,30 T80,40 T100,10" fill="none" stroke="#c8e9ec" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="col-span-12 xl:col-span-4 bg-surface-container border border-outline-variant rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-primary uppercase tracking-wide" style={GROTESK}>Signal Commanders</h3>
            <span className="material-symbols-outlined text-secondary text-[18px] filled">military_tech</span>
          </div>
          <div className="flex gap-4 border-b border-surface-container-high mb-3">
            {(["today","week","alltime"] as const).map(t => (
              <button key={t} onClick={() => loadLeaders(t)}
                className={clsx("text-[10px] font-bold uppercase tracking-wider pb-2 transition-colors",
                  tab === t ? "text-primary-fixed border-b-2 border-primary-fixed" : "text-on-surface-variant hover:text-primary"
                )}>
                {t === "today" ? "Today" : t === "week" ? "Week" : "All-Time"}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {loading ? Array.from({length:3}).map((_,i) => (
              <div key={i} className="h-10 bg-surface-container-high rounded animate-pulse" />
            )) : leaders.length === 0 ? (
              <p className="text-on-surface-variant text-sm text-center py-6">No data yet</p>
            ) : leaders.slice(0,5).map((l, i) => (
              <div key={l.donor_name} className={clsx(
                "flex items-center gap-3 p-2 rounded transition-colors relative",
                i === 0 ? "bg-surface-container-high border border-primary-fixed/30 cyber-glow overflow-hidden" : "hover:bg-surface-container-high"
              )}>
                {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-fixed" />}
                <div className="w-5 text-center text-sm font-bold" style={GROTESK}>
                  <span className={i === 0 ? "text-primary-fixed" : "text-on-surface-variant"}>{i+1}</span>
                </div>
                <div className="w-7 h-7 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center text-[11px] font-bold text-on-surface-variant">
                  {l.donor_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-primary truncate">{l.donor_name}</div>
                </div>
                <div className="text-sm font-semibold text-primary-fixed">{formatRp(l.total_amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div className="col-span-12 bg-surface-container border border-outline-variant rounded-lg p-5">
          <div className="flex justify-between items-center mb-4 border-b border-surface-container-high pb-3">
            <h3 className="text-base font-semibold text-primary uppercase tracking-wide flex items-center gap-2" style={GROTESK}>
              <span className="material-symbols-outlined text-secondary animate-pulse text-[18px]">sensors</span>
              Incoming Signals
            </h3>
            <button className="text-[10px] font-bold uppercase tracking-wider text-primary-fixed hover:underline">View Log</button>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({length:3}).map((_,i)=>(
              <div key={i} className="h-14 bg-surface-container-high rounded animate-pulse"/>
            ))}</div>
          ) : donations.length === 0 ? (
            <div className="py-10 text-center">
              <span className="material-symbols-outlined text-[40px] text-outline mb-2 block">signal_disconnected</span>
              <p className="text-on-surface-variant text-sm">No signal detected yet</p>
              <p className="text-outline text-xs mt-1">Configure a platform webhook to start receiving donations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {donations.map(d => (
                <div key={d.donation_id}
                  className="flex items-center justify-between p-3 bg-surface-container-lowest border border-surface-container-high rounded hover:border-outline-variant transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[13px] font-bold text-on-surface-variant group-hover:border-primary-fixed transition-colors">
                      {d.donor_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-bold text-primary">{d.donor_name}</span>
                        <span className="text-on-surface-variant text-[11px]">transmitted via</span>
                        <span className={clsx(
                          "bg-surface-container-high px-1.5 py-[1px] rounded text-[9px] font-bold uppercase tracking-widest border",
                          PLATFORM_BADGE[d.platform] ?? "text-on-surface-variant border-outline-variant"
                        )}>
                          {PLATFORM_LABEL[d.platform] ?? d.platform}
                        </span>
                      </div>
                      {d.message && (
                        <div className="text-[11px] text-on-surface-variant italic mt-0.5 truncate max-w-[260px]">
                          &ldquo;{d.message}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-sm font-semibold text-primary-fixed tracking-tight">{formatRp(d.amount)}</div>
                    <div className="text-[9px] text-outline">{timeAgo(d.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
