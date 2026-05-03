"use client";
import { useState, useEffect, useCallback } from "react";
import { api, formatRp, PLATFORM_LABEL, type StatsResponse, type LeaderboardEntry } from "@/lib/api";
import { getLicenseKey } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";
import clsx from "clsx";

const G = { fontFamily: "var(--font-space-grotesk,'Space Grotesk'),sans-serif" };

const PLATFORM_COLOR: Record<string,string> = {
  saweria:"text-primary-fixed", socialbuzz:"text-secondary",
  bagibagi:"text-tertiary-fixed-dim", trakteer:"text-error", twitch:"text-purple-400",
};
const PLATFORM_BAR: Record<string,string> = {
  saweria:"bg-primary-fixed", socialbuzz:"bg-secondary",
  bagibagi:"bg-tertiary-fixed-dim", trakteer:"bg-error", twitch:"bg-purple-400",
};

export default function AnalyticsPage() { return <AuthGate><Analytics /></AuthGate>; }

function Analytics() {
  const licenseKey = getLicenseKey();
  const [stats,    setStats]    = useState<StatsResponse|null>(null);
  const [leaders,  setLeaders]  = useState<LeaderboardEntry[]>([]);
  const [logs,     setLogs]     = useState<any[]>([]);
  const [tab,      setTab]      = useState<"today"|"week"|"month"|"alltime">("month");
  const [logFilter,setLogFilter]= useState("all");
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async()=>{
    if(!licenseKey)return;
    try{
      const [s,l,wl] = await Promise.allSettled([
        api.donations.stats(licenseKey),
        api.leaderboard(licenseKey,"alltime"),
        api.webhook.logs().catch(()=>({logs:[],total:0})),
      ]);
      if(s.status==="fulfilled") setStats(s.value);
      if(l.status==="fulfilled") setLeaders(l.value.leaderboard);
      if(wl.status==="fulfilled") setLogs((wl.value as any).logs??[]);
    } finally { setLoading(false); }
  },[licenseKey]);

  useEffect(()=>{ load(); },[load]);

  const loadLeaders = async(tf: typeof tab)=>{
    if(!licenseKey)return; setTab(tf);
    const r = await api.leaderboard(licenseKey,tf).catch(()=>null);
    if(r) setLeaders(r.leaderboard);
  };

  const doExport = ()=>{
    if(!licenseKey)return;
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/donations/export?license_key=${licenseKey}&format=csv`;
    window.open(url,"_blank");
  };

  const totals = (stats as any)?.totals;
  const byPlat = (stats as any)?.by_platform??[];
  const maxVol = Math.max(...byPlat.map((p:any)=>p.total),1);

  const filteredLogs = logFilter==="all" ? logs : logFilter==="errors" ? logs.filter((l:any)=>l.status>=400) : logs.filter((l:any)=>l.platform===logFilter);

  return (
    <div className="p-6 max-w-[1440px] mx-auto pb-20 md:pb-8">
      {/* Header */}
      <header className="flex justify-between items-end mb-6 border-b border-surface-container-high pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-primary tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" style={G}>Analytics Hub</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">Deep dive into multi-dimensional signal flows and asset ingestion.</p>
        </div>
        <button onClick={doExport} className="bg-primary text-on-primary text-[10px] font-bold uppercase px-4 py-2 rounded hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all flex items-center gap-1.5" style={G}>
          <span className="material-symbols-outlined text-[15px]">download</span>Export CSV
        </button>
      </header>

      {/* Timeframe Tabs */}
      <div className="flex gap-6 mb-6 border-b border-outline-variant">
        {(["today","week","month","alltime"] as const).map(t=>(
          <button key={t} onClick={()=>loadLeaders(t)}
            className={clsx("text-[10px] font-bold uppercase pb-2 transition-colors", tab===t?"text-primary border-b-2 border-primary drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]":"text-on-surface-variant hover:text-on-surface")}
            style={G}>
            {t==="today"?"Today":t==="week"?"This Week":t==="month"?"This Month":"All Time"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Summary pills */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            {label:"Total Volume",  val:totals?formatRp(totals.total??0):"—",   color:"bg-primary"},
            {label:"Transactions",  val:totals?String(totals.count??0):"—",       color:"bg-secondary"},
            {label:"Avg Signal",    val:totals?formatRp(Math.round(totals.avg??0)):"—", color:"bg-primary-fixed"},
            {label:"Unique Entities",val:totals?String(totals.unique_donors??0):"—",    color:"bg-secondary-fixed"},
          ].map(({label,val,color})=>(
            <div key={label} className="bg-surface-container border border-surface-container-high rounded p-5 relative overflow-hidden group">
              <div className={clsx("absolute top-0 left-0 w-full h-0.5 opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_10px] transition-all",color)}/>
              <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2" style={G}>{label}</div>
              <div className="text-[36px] font-black text-primary tracking-tighter leading-none drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]" style={G}>
                {loading?"—":val}
              </div>
            </div>
          ))}
        </div>

        {/* Platform Breakdown */}
        <div className="col-span-12 md:col-span-4 bg-surface-container border border-surface-container-high rounded p-5 flex flex-col">
          <h3 className="text-base font-semibold text-on-surface mb-5" style={G}>Platform Ingestion</h3>
          <div className="flex-1 flex flex-col gap-4">
            {byPlat.length===0 ? (
              <p className="text-on-surface-variant text-sm">No data yet</p>
            ) : byPlat.map((p:any)=>{
              const pct = Math.round((p.total/maxVol)*100);
              return (
                <div key={p.platform} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-on-surface-variant">
                    <span>{PLATFORM_LABEL[p.platform]??p.platform}</span>
                    <span className={PLATFORM_COLOR[p.platform]??""}>
                      {pct}% / {formatRp(p.total)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className={clsx("h-full rounded-full transition-all duration-700",PLATFORM_BAR[p.platform]??"bg-outline")}
                      style={{width:`${pct}%`, filter:"drop-shadow(0 0 4px currentColor)"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 30-Day Trend */}
        <div className="col-span-12 md:col-span-8 bg-surface-container border border-surface-container-high rounded p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold text-on-surface" style={G}>Signal Trend (30 Days)</h3>
            <span className="px-2 py-1 bg-surface-container-highest text-primary text-[10px] font-bold uppercase rounded border border-surface-container-high" style={G}>
              All Time
            </span>
          </div>
          <div className="flex-1 relative min-h-[200px]">
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line stroke="#353534" strokeWidth="0.5" x1="0" x2="100" y1="25" y2="25"/>
              <line stroke="#353534" strokeWidth="0.5" x1="0" x2="100" y1="50" y2="50"/>
              <line stroke="#353534" strokeWidth="0.5" x1="0" x2="100" y1="75" y2="75"/>
              {(stats as any)?.by_day?.length > 1 ? (()=>{
                const days:(({total:number})[]) = (stats as any).by_day;
                const max = Math.max(...days.map(d=>d.total),1);
                const pts = days.map((d,i)=>`${(i/(days.length-1))*100},${100-(d.total/max)*90}`);
                return (<>
                  <path d={`M${pts.join(" L")}`} fill="none" stroke="#ffffff" strokeWidth="1.5" style={{filter:"drop-shadow(0px 0px 4px rgba(255,255,255,0.4))"}}/>
                  {days.map((d,i)=>{
                    const cx=(i/(days.length-1))*100;
                    const cy=100-(d.total/max)*90;
                    return <circle key={i} cx={cx} cy={cy} r={i===days.length-1?"2.5":"1.5"} fill="#ffffff" className={i===days.length-1?"animate-pulse":""}/>;
                  })}
                </>);
              })() : (
                <>
                  <path d="M0,90 Q10,80 20,85 T40,60 T60,50 T80,20 T100,10" fill="none" stroke="#ffffff" strokeWidth="1.5" style={{filter:"drop-shadow(0px 0px 4px rgba(255,255,255,0.5))"}}/>
                  {[[0,90],[20,85],[40,60],[60,50],[80,20],[100,10]].map(([cx,cy],i)=>(
                    <circle key={i} cx={cx} cy={cy} r={i===5?"2.5":"1.5"} fill="#ffffff" className={i===5?"animate-pulse":""}/>
                  ))}
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Entity Ledger */}
        <div className="col-span-12 bg-surface-container border border-surface-container-high rounded overflow-hidden">
          <div className="p-5 border-b border-surface-container-high flex justify-between items-center">
            <h3 className="text-base font-semibold text-on-surface" style={G}>Entity Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-lowest">
                  {["Rank","Designation","Vector","Volume","Count","Last Sync"].map(h=>(
                    <th key={h} className="p-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant border-b border-surface-container-high text-left last:text-right"
                      style={G}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface">
                {leaders.slice(0,20).map((l,i)=>{
                  const rankColor = i===0?"text-primary":i===1?"text-secondary":i===2?"text-primary-fixed":"text-on-surface-variant";
                  return (
                    <tr key={l.donor_name} className="hover:bg-surface-container-highest transition-colors border-b border-surface-container-high/50 group">
                      <td className={clsx("p-4 font-bold",rankColor)}>#{String(i+1).padStart(2,"0")}</td>
                      <td className="p-4 flex items-center gap-2">
                        <div className={clsx("w-6 h-6 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center text-[10px] font-bold",rankColor)}>
                          {l.donor_name.charAt(0).toUpperCase()}
                        </div>
                        {l.donor_name}
                      </td>
                      <td className="p-4">
                        <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-transparent",
                          `${PLATFORM_COLOR[l.platform]??""} border-current/30`)}>
                          {PLATFORM_LABEL[l.platform]??l.platform}
                        </span>
                      </td>
                      <td className={clsx("p-4 font-semibold group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]",rankColor)}>
                        {formatRp(l.total_amount)}
                      </td>
                      <td className="p-4 text-on-surface-variant">{l.donation_count}</td>
                      <td className="p-4 text-on-surface-variant text-right text-xs">
                        {l.last_donation_at ? new Date(l.last_donation_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw Signal Logs */}
        <div className="col-span-12 bg-surface-container border border-surface-container-high rounded overflow-hidden flex flex-col">
          <div className="p-5 border-b border-surface-container-high flex justify-between items-center bg-surface-container-lowest">
            <h3 className="text-base font-semibold text-primary flex items-center gap-2" style={G}>
              <span className="material-symbols-outlined text-[16px]">terminal</span>Raw Signal Logs
            </h3>
            <div className="flex gap-2 flex-wrap">
              {["all","errors","saweria","socialbuzz","bagibagi","trakteer"].map(f=>(
                <button key={f} onClick={()=>setLogFilter(f)}
                  className={clsx("px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border transition-colors",
                    logFilter===f?"bg-primary/20 text-primary border-primary/50":"bg-surface-container-highest text-on-surface-variant border-surface-container-high hover:text-on-surface")}
                  style={G}>{f==="all"?"All Vectors":f==="errors"?"Errors":PLATFORM_LABEL[f]??f}</button>
              ))}
            </div>
          </div>
          <div className="p-4 bg-black/50 font-mono text-[11px] leading-relaxed text-on-surface-variant h-[240px] overflow-y-auto space-y-3">
            {filteredLogs.length===0 ? (
              <div className="flex items-center gap-2 text-outline py-2">
                <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                No logs yet — start receiving webhooks to see entries here.
              </div>
            ) : filteredLogs.map((l:any)=>(
              <div key={l.id} className={clsx(
                "border-l-2 pl-3 py-1 relative group cursor-pointer rounded-r transition-colors hover:bg-surface-container-high",
                l.status>=400?"border-error":"border-primary-fixed"
              )}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="text-primary-fixed">[{new Date(l.created_at).toISOString().slice(11,19)}]</span>
                    <span className={clsx("font-bold",l.status>=400?"text-error":"text-primary")}>{l.status>=400?"WARN":"INFO"}</span>
                    <span className="text-on-surface uppercase tracking-wider">{l.platform?.toUpperCase()}_WEBHOOK</span>
                    <span className={clsx("px-1 rounded text-[9px]",l.status>=400?"bg-error/20 text-error":"bg-primary-fixed/10 text-primary-fixed")}>
                      {l.status}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[12px] text-outline opacity-0 group-hover:opacity-100">expand_more</span>
                </div>
                {l.payload_parsed && (
                  <div className="mt-1 pl-4 text-primary-fixed-dim/70 text-[10px]">
                    {JSON.stringify(l.payload_parsed).slice(0,120)}…
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
