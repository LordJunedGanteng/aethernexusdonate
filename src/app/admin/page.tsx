'use client';

import { useState, useEffect, useRef } from 'react';
import { api, type RobloxGameInfo, WORKER_URL } from '@/lib/api';
import AuthGate from '@/components/AuthGate';
import clsx from 'clsx';

const G = { fontFamily: "var(--font-space-grotesk,'Space Grotesk'),sans-serif" };

export default function AdminPage() { return <AuthGate adminOnly><Admin /></AuthGate>; }

function Admin() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [logs,    setLogs]    = useState<any[]>([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username:     "",
    password:     "",
    role:         "standard",
    licensed_to:  "",
    universe_id:  "",
  });
  const [showPw, setShowPw] = useState(false);
  const [genResult, setGenResult] = useState<{license_key:string; username:string}|null>(null);
  const [gamePreview, setGamePreview] = useState<RobloxGameInfo|null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    Promise.allSettled([
      api.admin.listUsers(),
      api.admin.getLogs(),
    ]).then(([u,l])=>{
      if(u.status==="fulfilled") setUsers((u.value as any).users??[]);
      if(l.status==="fulfilled") setLogs((l.value as any).results??[]);
    }).finally(()=>setLoading(false));
  },[]);

  // Debounced Roblox preview fetch
  useEffect(()=>{
    const uid = form.universe_id.trim();
    if (!uid || uid.length < 5) { setGamePreview(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      setGamePreview(null);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        // Try worker first (has KV cache), fallback to direct Roblox API
        let data: RobloxGameInfo | null = null;
        try {
          const res = await fetch(`${WORKER_URL}/api/roblox/game?universe_id=${uid}`, { signal: controller.signal });
          if (res.ok) data = await res.json();
        } catch {}

        // Direct Roblox API fallback
        if (!data) {
          const [gRes, tRes] = await Promise.all([
            fetch(`https://games.roblox.com/v1/games?universeIds=${uid}`, { signal: controller.signal }),
            fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${uid}&size=512x512&format=Png&isCircular=false`, { signal: controller.signal }),
          ]);
          if (gRes.ok) {
            const gd = await gRes.json() as { data: any[] };
            const g = gd.data?.[0];
            if (g) {
              const td = tRes.ok ? await tRes.json() as { data: any[] } : { data: [] };
              data = {
                universeId:  g.id,
                name:        g.name,
                description: g.description ?? '',
                creator:     g.creator?.name ?? 'Unknown',
                playing:     g.playing ?? 0,
                visits:      g.visits ?? 0,
                maxPlayers:  g.maxPlayers ?? 0,
                thumbnailUrl: td.data?.[0]?.imageUrl ?? null,
              };
            }
          }
        }
        setGamePreview(data);
      } catch { setGamePreview(null); }
      finally { clearTimeout(timeout); setPreviewLoading(false); }
    }, 700);
  },[form.universe_id]);

  const generate = async () => {
    if (!form.username.trim() || !form.password.trim()) return;
    setSaving(true);
    try {
      const r = await api.admin.generateKey(form.username, form.password, form.role, form.licensed_to, form.universe_id);
      setGenResult(r as any);
      setForm({ username: "", password: "", role: "standard", licensed_to: "", universe_id: "" });
      const ru = await api.admin.listUsers();
      setUsers((ru as any).users ?? []);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role:string) => {
    if(role==="admin")    return "bg-primary-container text-on-primary-container";
    if(role==="premium")  return "bg-secondary-container text-on-secondary-container";
    return "bg-surface-variant text-on-surface";
  };

  const logColor = (msg:string) => {
    if(msg?.includes("[WARN]")||msg?.includes("WARN")) return "text-error";
    if(msg?.includes("[SYSTEM]")) return "text-primary-fixed";
    if(msg?.includes("[CRON]"))   return "text-secondary-fixed";
    return "text-emerald-400";
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto pb-20 md:pb-8">
      {/* Header */}
      <header className="col-span-12 mb-6">
        <h1 className="text-[28px] font-semibold text-primary tracking-tight" style={G}>System Administration</h1>
        <p className="text-on-surface-variant text-sm mt-0.5">Global telemetry, user provisioning, and secure access management.</p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        {[
          { label:"Total Users",      val: loading?"…":String(users.length),    icon:"group",      top:"border-primary-fixed"  },
          { label:"Active Licenses",  val: loading?"…":"—",                      icon:"key",        top:"border-secondary-fixed"},
          { label:"Donations Today",  val: "—",                                  icon:"payments",   top:"border-tertiary-fixed" },
          { label:"Worker Status",    val: "Online",                             icon:"circle",     top:"border-emerald-400", accent:"text-emerald-400" },
        ].map(({label,val,icon,top,accent})=>(
          <div key={label} className={clsx("bg-surface-container border-t-2 rounded p-5 shadow-sm relative overflow-hidden group",top)}>
            <div className="absolute -right-3 -top-3 text-surface-container-highest opacity-50 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined filled text-[70px]">{icon}</span>
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2" style={G}>{label}</h3>
            <div className={clsx("text-[36px] font-black tracking-tighter leading-none drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]",accent??"text-primary")} style={G}>
              {val}
              {label==="Worker Status" && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                    <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"/>
                  </span>
                  <span className="text-emerald-400 text-[10px] font-mono">latency: 14ms</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* Provision Key Form */}
        <div className="col-span-12 md:col-span-4 bg-surface-container rounded-lg p-5 shadow-md border border-surface-container-high flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-surface-container-high pb-4">
            <span className="material-symbols-outlined text-primary-fixed text-[20px]">add_circle</span>
            <h2 className="text-lg font-semibold text-primary" style={G}>Provision Key</h2>
          </div>

          <div className="space-y-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={G}>Username</label>
              <input
                value={form.username}
                onChange={e=>setForm({...form,username:e.target.value})}
                placeholder="e.g. streamer_01"
                className="bg-surface-container-high border border-outline-variant rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary-fixed focus:shadow-[0_0_8px_rgba(200,233,236,0.15)] transition-all font-mono"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={G}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e=>setForm({...form,password:e.target.value})}
                  placeholder="Set user password"
                  className="w-full bg-surface-container-high border border-outline-variant rounded px-3 pr-9 py-2.5 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary-fixed focus:shadow-[0_0_8px_rgba(200,233,236,0.15)] transition-all font-mono"
                />
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">{showPw?"visibility_off":"visibility"}</span>
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={G}>Access Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val:"standard", label:"Trial", sub:"5 Days",   color:"border-primary-fixed text-primary-fixed" },
                  { val:"premium",  label:"Lifetime", sub:"∞",      color:"border-secondary text-secondary" },
                  { val:"admin",    label:"Admin",    sub:"Full",   color:"border-primary text-primary" },
                ].map(({val,label,sub,color})=>(
                  <button key={val} type="button"
                    onClick={()=>setForm({...form,role:val})}
                    className={clsx(
                      "flex flex-col items-center py-2.5 rounded border-2 transition-all text-center",
                      form.role===val ? `${color} bg-surface-container-highest` : "border-outline-variant text-on-surface-variant hover:border-outline"
                    )} style={G}>
                    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                    <span className="text-[9px] font-mono opacity-70">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Licensed To */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={G}>Licensed To</label>
              <input
                value={form.licensed_to}
                onChange={e=>setForm({...form,licensed_to:e.target.value})}
                placeholder="e.g. Nexus Protocol, John's Game"
                className="bg-surface-container-high border border-outline-variant rounded px-3 py-2.5 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary-fixed focus:shadow-[0_0_8px_rgba(200,233,236,0.15)] transition-all"
              />
            </div>

            {/* Universe ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={G}>
                Universe ID
                <span className="ml-1.5 text-outline normal-case font-normal">— Roblox Experience ID</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[15px]">public</span>
                <input
                  value={form.universe_id}
                  onChange={e=>setForm({...form,universe_id:e.target.value.replace(/\D/g,"")})}
                  placeholder="e.g. 6872265039"
                  className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary-fixed focus:shadow-[0_0_8px_rgba(200,233,236,0.15)] transition-all font-mono"
                />
              </div>
              <p className="text-[9px] text-outline font-mono">
                Roblox → Game → ⋯ → Copy Universe ID
              </p>

              {/* Live Game Preview */}
              {previewLoading && (
                <div className="flex items-center gap-2 bg-surface-container-highest border border-outline-variant rounded p-3 animate-pulse">
                  <div className="w-14 h-14 rounded bg-surface-container-high shrink-0"/>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-container-high rounded w-3/4"/>
                    <div className="h-2 bg-surface-container-high rounded w-1/2"/>
                  </div>
                </div>
              )}
              {!previewLoading && form.universe_id.length >= 5 && !gamePreview && (
                <div className="flex items-center gap-2 bg-error/5 border border-error/20 rounded p-2.5 text-[10px] text-error font-mono">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Universe ID not found — make sure it's a Universe ID, not a Place ID
                </div>
              )}
              {!previewLoading && gamePreview && (
                <div className="relative overflow-hidden bg-surface-container-highest border border-primary-fixed/30 rounded shadow-[0_0_12px_rgba(200,233,236,0.08)] flex gap-3 p-3">
                  {/* Thumbnail */}
                  {gamePreview.thumbnailUrl ? (
                    <img
                      src={gamePreview.thumbnailUrl}
                      alt={gamePreview.name}
                      className="w-16 h-16 rounded object-cover border border-outline-variant shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-outline text-[24px]">sports_esports</span>
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-primary-fixed text-[11px] font-bold truncate" style={G}>{gamePreview.name}</div>
                    <div className="text-outline-variant text-[9px] font-mono mt-0.5">by {gamePreview.creator}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                        {gamePreview.playing.toLocaleString()} playing
                      </span>
                      <span className="text-[9px] text-outline-variant font-mono">
                        {(gamePreview.visits/1000).toFixed(1)}K visits
                      </span>
                    </div>
                  </div>
                  {/* Verified badge */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-primary-fixed bg-primary-fixed/10 border border-primary-fixed/30 px-1.5 py-0.5 rounded font-mono">
                      ✓ Verified
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={saving || !form.username.trim() || !form.password.trim()}
            className="mt-2 bg-primary text-on-primary text-[10px] font-bold uppercase py-3 rounded hover:bg-primary-fixed hover:shadow-[0_0_15px_rgba(200,233,236,0.4)] transition-all flex items-center justify-center gap-2 group disabled:opacity-40"
            style={G}>
            {saving
              ? <><span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>Creating Account…</>
              : <><span className="material-symbols-outlined text-[15px] group-hover:rotate-90 transition-transform">person_add</span>Create Account & License</>
            }
          </button>

          {/* Success result */}
          {genResult && (
            <div className="bg-surface-container-high border border-primary-fixed/50 rounded p-3 space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-primary-fixed font-bold uppercase" style={G}>
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Account Created — {genResult.username}
              </div>
              <div className="flex items-center justify-between group cursor-pointer hover:bg-surface-container-highest rounded px-2 py-1 transition-colors"
                onClick={()=>navigator.clipboard.writeText(genResult.license_key)}>
                <code className="font-mono text-secondary-fixed text-xs tracking-wider">{genResult.license_key}</code>
                <span className="material-symbols-outlined text-[14px] text-outline-variant group-hover:text-primary-fixed transition-colors">content_copy</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Telemetry Logs */}
        <div className="col-span-12 md:col-span-8 bg-surface-container rounded-lg shadow-md border border-surface-container-high flex flex-col h-[420px]">
          <div className="flex justify-between items-center border-b border-surface-container-high p-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed">terminal</span>
              <h2 className="text-lg font-semibold text-primary" style={G}>Live Telemetry Logs</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-secondary opacity-75"/>
                <span className="relative h-2 w-2 rounded-full bg-secondary"/>
              </span>
              <span className="text-on-surface-variant text-[10px] uppercase font-mono">Stream Active</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed flex flex-col gap-1 bg-[#0a0a0a] rounded-b-lg">
            {loading ? (
              Array.from({length:5}).map((_,i)=>(
                <div key={i} className="h-5 bg-surface-container-high rounded animate-pulse mb-1"/>
              ))
            ) : logs.length===0 ? (
              <div className="text-outline py-4 text-center">No logs — deploy worker and trigger a webhook to see events.</div>
            ) : logs.map((l:any,i:number)=>(
              <div key={i} className="flex items-start gap-3 hover:bg-surface-container-highest px-2 py-0.5 rounded transition-colors group">
                <span className="text-outline-variant shrink-0 font-mono">
                  {l.created_at ? new Date(l.created_at).toISOString().slice(11,19) : "--:--:--"}
                </span>
                <span className={clsx("font-bold shrink-0", logColor(l.payload??""))}>
                  [WEBHOOK]
                </span>
                <span className="text-on-surface break-all">
                  {l.platform?.toUpperCase()}_PAYLOAD — status {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Access Directory */}
        <div className="col-span-12 bg-surface-container rounded-lg shadow-md border border-surface-container-high overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-surface-container-high bg-surface-container-low">
            <h2 className="text-lg font-semibold text-primary" style={G}>Access Directory</h2>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[15px]">search</span>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search ID or username…"
                className="bg-surface-container-high border border-outline-variant rounded-full pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary-fixed transition-colors w-60"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-high border-b border-surface-variant">
                  {["ID","Entity Alias","Comm Link","Clearance","Active Keys","Ingress Date","Directives"].map(h=>(
                    <th key={h} className={clsx("p-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant",h==="Directives"&&"text-right")} style={G}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface">
                {loading ? Array.from({length:3}).map((_,i)=>(
                  <tr key={i}><td colSpan={7} className="p-4"><div className="h-6 bg-surface-container-high rounded animate-pulse"/></td></tr>
                )) : filtered.map((u:any)=>(
                  <tr key={u.id} className="border-b border-surface-variant hover:bg-surface-container-highest transition-colors group">
                    <td className="p-4 font-mono text-outline-variant text-xs">#{String(u.id).padStart(4,"0")}</td>
                    <td className="p-4 font-semibold text-primary-fixed">{u.username}</td>
                    <td className="p-4 text-on-surface-variant">{u.email??""}</td>
                    <td className="p-4">
                      <select
                        value={u.role??"standard"}
                        onChange={async e=>{
                          const newRole = e.target.value;
                          try {
                            await api.admin.updateRole(u.id, newRole);
                            setUsers(prev => prev.map(x => x.id===u.id ? {...x,role:newRole} : x));
                          } catch(err:any){ alert(err.message); }
                        }}
                        className={clsx(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer border-0 outline-none appearance-none",
                          roleBadge(u.role??"standard")
                        )}
                        style={G}
                      >
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">key</span>
                        {u.license_count??0}
                      </span>
                    </td>
                    <td className="p-4 text-outline-variant text-xs">{u.created_at?.slice(0,10)??"—"}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete user "${u.username}"? This will also remove their license and all platform configs.`)) return;
                          try {
                            await api.admin.deleteUser(u.id);
                            setUsers(prev => prev.filter(x => x.id !== u.id));
                          } catch (e: any) { alert(e.message); }
                        }}
                        className="material-symbols-outlined text-outline-variant hover:text-error hover:drop-shadow-[0_0_6px_rgba(255,180,171,0.5)] transition-all text-[18px]">
                        delete_forever
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-surface-container-low flex justify-between items-center text-outline-variant text-[10px] font-mono">
            <span>Displaying {filtered.length} of {users.length} entities</span>
            <div className="flex gap-2">
              <button className="material-symbols-outlined hover:text-primary transition-colors text-[18px]">chevron_left</button>
              <button className="material-symbols-outlined hover:text-primary transition-colors text-[18px]">chevron_right</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
