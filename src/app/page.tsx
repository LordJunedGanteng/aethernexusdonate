"use client";
import { useEffect, useState, useCallback } from "react";
import { api, formatRp, formatRpFull, PLATFORM_COLOR, PLATFORM_LABEL, type Donation, type LeaderboardEntry, type StatsResponse } from "@/lib/api";
import { useLicenseKey } from "@/lib/use-license";

function StatCard({ label, value, trend, dir, prefix }: {
  label: string; value: string; trend: string; dir: 1 | 0 | -1; prefix?: string;
}) {
  return (
    <div className="bg-surface-container-highest rounded-xl p-5 flex flex-col gap-2 border border-outline-variant/10">
      <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant font-headline">{label}</span>
      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-lg font-bold font-headline text-primary">{prefix}</span>}
        <span className="text-3xl font-extrabold font-headline tracking-tight">{value}</span>
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-semibold ${dir === 1 ? "text-emerald-400" : dir === -1 ? "text-error" : "text-tertiary"}`}>
        <span className="material-symbols-outlined text-sm filled">
          {dir === 1 ? "trending_up" : dir === -1 ? "trending_down" : "horizontal_rule"}
        </span>
        <span>{trend}</span>
      </div>
    </div>
  );
}

const PLATFORM_ICON: Record<string, string> = {
  saweria: "volunteer_activism",
  socialbuzz: "payments",
  bagibagi: "card_giftcard",
};

const PLATFORM_ICON_CLS: Record<string, string> = {
  saweria: "text-secondary",
  socialbuzz: "text-tertiary",
  bagibagi: "text-primary",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  const { key } = useLicenseKey();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<Donation[]>([]);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!key) return;
    try {
      const [s, r, l] = await Promise.all([
        api.donations.stats(key),
        api.donations.recent(key, 7),
        api.leaderboard(key, "week"),
      ]);
      setStats(s);
      setRecent(r.donations ?? []);
      setBoard(l.leaderboard ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [key]);

  useEffect(() => { load(); const id = setInterval(load, 30_000); return () => clearInterval(id); }, [load]);

  const t = stats?.totals;
  const bars = stats?.by_day ?? [];
  const maxBar = Math.max(...bars.map((b) => b.total), 1);

  return (
    <div className="px-4 pb-8 space-y-8 max-w-lg mx-auto">
      {/* Hero Stats */}
      <section className="grid grid-cols-2 gap-3 pt-4">
        <StatCard label="Total Revenue"  value={loading ? "—" : formatRp(t?.total ?? 0)}         trend={t ? "Live" : "—"}   dir={1}  prefix="Rp " />
        <StatCard label="Unique Donors"  value={loading ? "—" : String(t?.unique_donors ?? 0)}   trend={t ? "Live" : "—"}   dir={1}  />
        <StatCard label="Donations"      value={loading ? "—" : String(t?.count ?? 0)}            trend="This license"        dir={0}  />
        <StatCard label="Avg Donation"   value={loading ? "—" : formatRp(t?.avg ?? 0)}            trend={t ? "per donor" : "—"} dir={1} prefix="Rp " />
      </section>

      {/* Donation Trend (by day) */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-bold font-headline">Donation Trend</h2>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Last {bars.length || 7} Days</span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 h-44 relative overflow-hidden flex items-end gap-2 border border-outline-variant/5">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-primary/10 animate-pulse" style={{ height: `${30 + i * 10}%` }} />
              ))
            : bars.length > 0
            ? bars.map((b, i) => {
                const h = Math.max(4, Math.round((b.total / maxBar) * 100));
                const isMax = b.total === maxBar;
                return (
                  <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm" style={{
                      height: `${h}%`,
                      background: isMax
                        ? "linear-gradient(135deg,#aec6ff,#1e3c72)"
                        : `rgba(174,198,255,${0.15 + h / 250})`,
                      boxShadow: isMax ? "0 -8px 16px rgba(174,198,255,0.2)" : undefined,
                    }} />
                  </div>
                );
              })
            : <div className="w-full text-center text-on-surface-variant text-sm self-center">No data yet</div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        </div>
        {bars.length > 0 && (
          <div className="flex justify-between px-1 text-[9px] text-on-surface-variant font-mono">
            {bars.map((b) => (
              <span key={b.day}>{new Date(b.day).toLocaleDateString("id-ID", { weekday: "short" })}</span>
            ))}
          </div>
        )}
      </section>

      {/* Recent Stream */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold font-headline">Recent Stream</h2>
          <button onClick={load} className="text-secondary text-sm font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-base">refresh</span>Refresh
          </button>
        </div>
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface-container-highest rounded-xl p-4 h-16 animate-pulse border border-outline-variant/10" />
              ))
            : recent.length === 0
            ? <div className="text-center text-on-surface-variant text-sm py-8">No donations yet</div>
            : recent.map((d, i) => (
                <div key={d.donation_id ?? i} className="bg-surface-container-highest rounded-xl p-4 flex items-center justify-between border border-outline-variant/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center">
                      <span className={`material-symbols-outlined filled ${PLATFORM_ICON_CLS[d.platform] ?? "text-primary"}`}>
                        {PLATFORM_ICON[d.platform] ?? "volunteer_activism"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-on-surface text-sm">{d.donor_name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-tight ${PLATFORM_COLOR[d.platform] ?? "text-primary"} bg-surface-container/60`}>
                          {PLATFORM_LABEL[d.platform] ?? d.platform}
                        </span>
                        <span className="text-xs text-on-surface-variant">{timeAgo(d.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-base font-extrabold font-headline text-primary">
                    Rp {formatRp(d.amount)}
                  </span>
                </div>
              ))
          }
        </div>
      </section>

      {/* Leaderboard */}
      <section className="space-y-4 pb-4">
        <h2 className="text-lg font-bold font-headline">Top Command Donors</h2>
        <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr>
                {["Rank", "User", "Total"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ${i === 2 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={3} className="px-4 py-3"><div className="h-4 rounded bg-surface-container-high animate-pulse" /></td></tr>
                  ))
                : board.length === 0
                ? <tr><td colSpan={3} className="px-4 py-6 text-center text-on-surface-variant text-sm">No donors this week</td></tr>
                : board.slice(0, 9).map((e) => (
                    <tr key={e.rank} className={e.rank === 1 ? "bg-primary/5" : ""}>
                      <td className={`px-4 py-3 text-sm font-bold ${e.rank === 1 ? "text-primary" : "text-on-surface-variant"}`}>
                        {String(e.rank).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3">
                        {e.rank === 1
                          ? <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-container border border-primary/30 flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                                {e.donor_name[0]}
                              </div>
                              <span className="text-sm font-semibold">{e.donor_name}</span>
                            </div>
                          : <span className="text-sm font-semibold">{e.donor_name}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold font-headline">
                        Rp {formatRp(e.total_amount)}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
