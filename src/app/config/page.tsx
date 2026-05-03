"use client";
import { useState, useEffect, useCallback } from "react";
import { api, type PlatformConfig } from "@/lib/api";
import AuthGate from "@/components/AuthGate";
import clsx from "clsx";

const G = { fontFamily: "var(--font-space-grotesk,'Space Grotesk'),sans-serif" };

type Def = { id: string; label: string; accentCls: string; badgeCls: string; activeColor: string; };

const PLATFORMS: Def[] = [
  { id:"saweria",    label:"Saweria",    accentCls:"border-saweria",    badgeCls:"text-primary-fixed border-primary-fixed/30",  activeColor:"#c8e9ec" },
  { id:"socialbuzz", label:"SocialBuzz", accentCls:"border-socialbuzz", badgeCls:"text-secondary border-secondary/30",          activeColor:"#ecb2ff" },
  { id:"bagibagi",   label:"BagiBagi",   accentCls:"border-bagibagi",   badgeCls:"text-tertiary-fixed-dim border-tertiary-fixed/40", activeColor:"#cfc6b0" },
  { id:"trakteer",   label:"Trakteer",   accentCls:"border-trakteer",   badgeCls:"text-error border-error/30",                  activeColor:"#ffb4ab" },
  { id:"twitch",     label:"Twitch",     accentCls:"border-twitch",     badgeCls:"text-purple-400 border-purple-400/30",         activeColor:"#bf94ff" },
];

function ago(iso: string) {
  const d = Math.floor((Date.now()-new Date(iso).getTime())/1000);
  return d<60?`${d}s ago`:d<3600?`${Math.floor(d/60)}m ago`:`${Math.floor(d/3600)}h ago`;
}

function Card({ p, cfg, health, onRefresh }: {
  p: Def; cfg?: PlatformConfig; health?: any; onRefresh: () => void;
}) {
  const [key, setKey]   = useState("");
  const [show, setShow] = useState(false);
  const [gen, setGen]   = useState(false);
  const [save,setSave]  = useState(false);
  const [tog, setTog]   = useState(false);
  const [test,setTest]  = useState(false);
  const [res, setRes]   = useState<"ok"|"fail"|null>(null);
  const [cpy, setCpy]   = useState(false);

  const active = cfg?.is_active ?? false;
  const url    = cfg?.webhook_url ?? null;
  const rbx    = cfg?.platform_api_key ?? null;

  const doGen  = async()=>{ setGen(true);  try{await api.platform.generateSecret(p.id);onRefresh();}finally{setGen(false);}  };
  const doSave = async()=>{ if(!key.trim())return; setSave(true); try{await api.platform.saveApiKey(p.id,key.trim());setKey("");onRefresh();}finally{setSave(false);} };
  const doTog  = async()=>{ setTog(true);  try{await api.platform.toggle(p.id,!active);onRefresh();}finally{setTog(false);}  };
  const doTest = async()=>{
    if(!url)return; setTest(true); setRes(null);
    try{
      const pl = p.id==="trakteer"
        ?{tr_id:"t_"+Math.random().toString(36).slice(2,8),supporter_name:"Test",unit_value:1000,quantity:1}
        :{donation_id:"t_"+Math.random().toString(36).slice(2,8),donor_name:"Test",amount:1000,currency:"IDR"};
      const r = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(pl)});
      setRes(r.ok?"ok":"fail");
    }catch{setRes("fail");}
    finally{setTest(false);setTimeout(()=>setRes(null),4000);}
  };
  const copUrl = ()=>{ if(!url)return; navigator.clipboard.writeText(url).then(()=>{setCpy(true);setTimeout(()=>setCpy(false),2000);}); };
  const copRbx = ()=>{ if(rbx)navigator.clipboard.writeText(rbx); };

  return (
    <section className={clsx("bg-surface-container rounded border border-surface-container-high relative overflow-hidden flex flex-col p-6 gap-4 transition-all hover:bg-surface-container-high", p.accentCls)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-primary tracking-wide" style={G}>{p.label}</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-highest rounded-full">
            <div className={clsx("w-1.5 h-1.5 rounded-full transition-colors", active?"animate-pulse":"bg-outline-variant")}
              style={active?{background:p.activeColor, boxShadow:`0 0 5px ${p.activeColor}`}:{}}/>
            <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">{!url?"Not configured":active?"Online":"Offline"}</span>
          </div>
        </div>
        {/* Toggle switch */}
        <button onClick={doTog} disabled={tog} className="relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none"
          style={{background: active ? p.activeColor : "#2a2a2a", boxShadow: active ? `0 0 8px ${p.activeColor}55` : "none"}}>
          <div className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-on-primary transition-all duration-200 shadow-sm", active?"left-[22px]":"left-[2px]")}
            style={{background: active ? "#0e0e0e" : "#ffffff"}}/>
        </button>
      </div>

      {/* Health badges */}
      {health && (
        <div className="flex flex-wrap gap-2">
          <span className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-0.5 text-[10px] text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">payments</span>
            {health.donations_today} Today
          </span>
          {health.last_received && (
            <span className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-0.5 text-[10px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              Last: {ago(health.last_received)}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
        {/* Webhook URL */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={G}>Webhook URL</label>
          <div className="flex rounded overflow-hidden">
            <input className="flex-1 bg-surface-container-lowest border-y border-l border-outline-variant text-on-surface font-mono text-xs px-3 py-2 outline-none truncate"
              readOnly value={url??""} placeholder="Generate a secret to reveal URL"/>
            {url ? (
              <>
                <button onClick={copUrl} className="bg-surface-container-highest border border-outline-variant px-3 text-on-surface hover:text-primary-fixed transition-colors text-[10px] font-bold uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">{cpy?"check":"content_copy"}</span>{cpy?"Copied":"Copy"}
                </button>
                <button onClick={doGen} disabled={gen} title="Regenerate" className="bg-surface-container-highest border-y border-r border-outline-variant px-2 text-on-surface-variant hover:text-primary-fixed transition-colors">
                  <span className={clsx("material-symbols-outlined text-[13px]",gen&&"animate-spin")}>refresh</span>
                </button>
              </>
            ) : (
              <button onClick={doGen} disabled={gen} className={clsx("bg-surface-container-highest border border-outline-variant px-3 text-[10px] font-bold uppercase flex items-center gap-1 transition-colors hover:bg-surface-bright",p.badgeCls.split(" ")[0])}>
                <span className={clsx("material-symbols-outlined text-[13px]",gen&&"animate-spin")}>{gen?"progress_activity":"key"}</span>
                {gen?"Generating…":"Generate"}
              </button>
            )}
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={G}>
            Platform API Key {cfg?.has_api_key && <span className="text-emerald-400 normal-case font-normal ml-1">✓ saved</span>}
          </label>
          <div className="relative">
            <input type={show?"text":"password"} value={key} onChange={e=>setKey(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doSave()}
              placeholder={cfg?.has_api_key?"Enter new key to update…":`${p.label} API key`}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded text-on-surface font-mono text-xs px-3 py-2 pr-9 focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed focus:shadow-[0_0_6px_rgba(200,233,236,0.2)] outline-none transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"/>
            <button onClick={()=>setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[15px]">{show?"visibility_off":"visibility"}</span>
            </button>
          </div>
        </div>

        {/* Roblox Config Key */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" style={G}>Roblox Config Key</label>
          <div className="flex rounded overflow-hidden">
            <input readOnly value={rbx??"N/A — Generate key first"}
              className="flex-1 bg-surface-dim border border-outline-variant/50 text-on-surface-variant font-mono text-xs px-3 py-2 outline-none truncate cursor-default"/>
            {rbx && (
              <button onClick={copRbx} className="bg-surface-container-highest border-y border-r border-outline-variant px-3 text-on-surface hover:text-primary-fixed transition-colors text-[10px] font-bold uppercase">Copy</button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-3 border-t border-surface-container-high mt-1">
        {res && (
          <div className={clsx("flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded", res==="ok"?"bg-emerald-500/20 text-emerald-400":"bg-error/20 text-error")}>
            <span className="material-symbols-outlined text-[13px] filled">{res==="ok"?"check_circle":"error"}</span>
            {res==="ok"?"Webhook reachable ✓":"Connection failed — check worker deployment"}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={doTest} disabled={test||!url}
            className="px-4 py-2 rounded border border-outline-variant text-on-surface text-[10px] font-bold uppercase hover:border-primary-fixed hover:text-primary-fixed hover:shadow-[0_0_8px_rgba(200,233,236,0.2)] transition-all disabled:opacity-40 flex items-center gap-1.5"
            style={G}>
            {test&&<span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>}
            Test Connection
          </button>
          <button onClick={doSave} disabled={save||!key.trim()}
            className="px-4 py-2 rounded bg-primary text-on-primary text-[10px] font-bold uppercase hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all disabled:opacity-40 flex items-center gap-1.5"
            style={G}>
            {save&&<span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>}
            {save?"Saving…":"Save Configuration"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ConfigPage() { return <AuthGate><Content /></AuthGate>; }

function Content() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [health,  setHealth]  = useState<Record<string,any>>({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const [c,h] = await Promise.allSettled([api.platform.getConfigs(), api.platform.health()]);
      if (c.status==="fulfilled") setConfigs(c.value.configs);
      if (h.status==="fulfilled") { const m:Record<string,any>={}; for(const x of h.value.health)m[x.platform]=x; setHealth(m); }
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ fetch(); },[fetch]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <header className="border-b border-surface-container-high pb-4">
        <h1 className="text-[28px] font-semibold text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={G}>Integration Vault</h1>
        <p className="text-on-surface-variant text-sm mt-1">Securely manage your donation stream endpoints and platform keys.</p>
      </header>
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading platform configs…
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {PLATFORMS.map(p=>(
            <Card key={p.id} p={p} cfg={configs.find(c=>c.platform===p.id)} health={health[p.id]} onRefresh={fetch}/>
          ))}
        </div>
      )}
    </div>
  );
}
