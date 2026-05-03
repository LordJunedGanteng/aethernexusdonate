"use client";
import { useEffect, useState, useCallback } from "react";
import { api, type License, PLATFORM_LABEL } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import clsx from "clsx";

const G = { fontFamily: "var(--font-space-grotesk,'Space Grotesk'),sans-serif" };

export default function LicensesPage() { return <AuthGate><Licenses /></AuthGate>; }

function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [editing,  setEditing]  = useState<License|null>(null);

  const load = useCallback(async () => {
    try { const r = await api.licenses.list(); setLicenses(r.licenses); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = licenses.filter(l =>
    l.license_key.toLowerCase().includes(search.toLowerCase()) ||
    (l.game_name??"").toLowerCase().includes(search.toLowerCase())
  );

  const primaryActive = licenses.find(l => l.status === "active");

  const statusBadge = (status: string) => {
    if (status === "active")    return "bg-primary-container/10 text-primary-fixed border border-primary-container/30";
    if (status === "expired")   return "bg-error-container/20 text-error border border-error-container";
    return "bg-surface text-on-surface-variant border border-outline-variant";
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto pb-20 md:pb-8 grid-bg min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-end mb-6 border-b border-surface-container-high pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-primary tracking-tight" style={G}>License Manager</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">View and manage hardware and game runtime licenses.</p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-5">

        {/* Active License Hero Card */}
        {primaryActive && (
          <section className="col-span-12 relative overflow-hidden rounded-lg bg-surface-container-highest border border-primary-container/30 cyber-glow-lg p-6 backdrop-blur-md">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"/>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary-container/5 rounded-full blur-3xl pointer-events-none"/>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="bg-primary-container text-on-primary-container text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 shadow-[0_0_8px_rgba(200,233,236,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container animate-pulse"/>
                    Primary Active
                  </span>
                  <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{primaryActive.game_name ?? "Nexus Core Engine"}</span>
                </div>
                <div className="font-mono text-2xl font-bold text-primary tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                  {primaryActive.license_key}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(JSON.parse(primaryActive.universe_ids||"[]") as string[]).map((uid:string) => (
                    <span key={uid} className="bg-surface border border-outline-variant text-on-surface-variant text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">public</span>
                      UNIV: {uid}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <div className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider" style={G}>Expiry</div>
                <div className="text-secondary text-base font-semibold drop-shadow-[0_0_5px_rgba(236,178,255,0.3)]">
                  {primaryActive.expires_at ?? "Never"}
                </div>
                <button
                  onClick={()=>setEditing(primaryActive)}
                  className="mt-1 bg-surface border border-outline hover:border-primary text-primary text-[10px] font-bold uppercase px-4 py-2 rounded transition-colors flex items-center gap-1.5"
                  style={G}>
                  <span className="material-symbols-outlined text-[14px]">edit</span>Edit License
                </button>
              </div>
            </div>
          </section>
        )}

        {/* License Table */}
        <section className="col-span-12 bg-surface-container border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-lg">
          <div className="px-5 py-4 border-b border-surface-container-high flex justify-between items-center bg-surface-container-low">
            <h2 className="text-base font-semibold text-on-surface" style={G}>Registered Keys</h2>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search keys…"
                className="bg-surface-container-highest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_8px_rgba(255,255,255,0.15)] text-on-surface text-sm rounded pl-9 pr-4 py-2 w-56 outline-none transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-container-high bg-surface-container-low">
                  {["License Key","Game / Entity","Status","Created","Expires","Actions"].map(h=>(
                    <th key={h} className={clsx("p-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant",h==="Actions"&&"text-right")} style={G}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface">
                {loading ? Array.from({length:3}).map((_,i)=>(
                  <tr key={i}><td colSpan={6} className="p-4"><div className="h-6 bg-surface-container-high rounded animate-pulse"/></td></tr>
                )) : filtered.map(l=>(
                  <tr key={l.id} className="border-b border-surface-container-high/50 hover:bg-surface-container-highest/50 transition-colors group">
                    <td className="p-4 font-mono text-primary group-hover:text-primary-container transition-colors text-xs">{l.license_key}</td>
                    <td className="p-4 text-on-surface">{l.game_name ?? "—"}</td>
                    <td className="p-4">
                      <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",statusBadge(l.status))}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant text-xs">{l.created_at?.slice(0,10)??"—"}</td>
                    <td className={clsx("p-4 text-xs",l.status==="expired"?"text-error":"text-on-surface")}>
                      {l.expires_at?.slice(0,10)??"Never"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={()=>setEditing(l)} className="text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button className="text-on-surface-variant hover:text-error transition-colors" title="Deactivate">
                          <span className="material-symbols-outlined text-[17px]">block</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={()=>setEditing(null)}>
          <div className="bg-surface-container border border-primary-fixed rounded-lg shadow-[0_0_30px_rgba(200,233,236,0.1)] max-w-md w-full p-6 relative"
            onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setEditing(null)} className="absolute top-4 right-4 text-outline-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-lg font-semibold text-primary mb-4" style={G}>Edit License</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1" style={G}>License Key</label>
                <input className="w-full bg-surface-container-high border border-outline-variant rounded px-3 py-2 font-mono text-xs text-primary outline-none" readOnly value={editing.license_key}/>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1" style={G}>Game Name</label>
                <input className="w-full bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-fixed transition-colors"
                  defaultValue={editing.game_name??""} placeholder="Game name"/>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setEditing(null)} className="flex-1 bg-surface-container-high border border-outline-variant text-on-surface text-[10px] font-bold uppercase py-2.5 rounded hover:bg-surface-variant transition-colors" style={G}>
                Cancel
              </button>
              <button className="flex-1 bg-primary text-on-primary text-[10px] font-bold uppercase py-2.5 rounded hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all" style={G}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
