"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { api, formatRp, PLATFORM_LABEL, type Donation } from "@/lib/api";
import { getLicenseKey, useAuth } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";
import clsx from "clsx";

const G = { fontFamily: "var(--font-space-grotesk,'Space Grotesk'),sans-serif" };

const PLAT_BADGE: Record<string,string> = {
  saweria:"text-primary-fixed",socialbuzz:"text-secondary",
  bagibagi:"text-tertiary-fixed-dim",trakteer:"text-error",twitch:"text-purple-400",
};

export default function StreamPage() { return <AuthGate><Stream /></AuthGate>; }

function Stream() {
  const licenseKey = getLicenseKey();

  const [duration, setDuration]  = useState(8);
  const [fontSize,  setFontSize]  = useState(16);
  const [showAvatar,setAvatar]    = useState(true);
  const [soundOn,   setSound]     = useState(false);
  const [preview,   setPreview]   = useState<Donation|null>(null);
  const [testing,   setTesting]   = useState(false);
  const [copied,    setCopied]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const overlayUrl = licenseKey
    ? `${process.env.NEXT_PUBLIC_API_URL}/overlay/${licenseKey}`
    : "";

  const copyUrl = () => {
    if(!overlayUrl)return;
    navigator.clipboard.writeText(overlayUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      await api.donations.inject("saweria","Test Commander",1000,"IDR","Keep up the great stream! The new overlay looks insane.");
      const fakeDonation: Donation = {
        donation_id: "preview_"+Date.now(),
        donor_name:  "Test Commander",
        amount:      1000,
        currency:    "IDR",
        platform:    "saweria",
        message:     "Keep up the great stream! The new overlay looks insane.",
        timestamp:   new Date().toISOString(),
      };
      setPreview(fakeDonation);
      if(timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(()=>setPreview(null), duration*1000);
    } finally { setTesting(false); }
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto pb-20 md:pb-8">
      {/* Header */}
      <header className="flex justify-between items-end mb-6 border-b border-surface-container-high pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-primary" style={G}>Overlay Configuration</h1>
          <p className="text-on-surface-variant text-sm mt-0.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed shadow-[0_0_6px_#c8e9ec] animate-pulse"/>
            Systems Operational. Alert engine active.
          </p>
        </div>
        <button className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary text-[10px] font-bold uppercase rounded transition-colors flex items-center gap-1.5" style={G}>
          <span className="material-symbols-outlined text-[15px]">save</span>Save Profile
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* Live Canvas */}
        <section className="xl:col-span-8 flex flex-col gap-4">
          <div className="bg-surface-container border border-outline-variant rounded overflow-hidden flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="bg-surface-container-high px-4 py-2.5 border-b border-outline-variant flex justify-between items-center">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2" style={G}>
                <span className="material-symbols-outlined text-[18px] text-primary-fixed">visibility</span>
                Live Canvas
              </h2>
              <span className="font-mono text-[10px] text-on-surface-variant">1920 × 1080 (Scaled)</span>
            </div>
            {/* Canvas area */}
            <div className="relative flex-1 bg-[radial-gradient(#353534_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center min-h-[420px] overflow-hidden bg-surface-container-lowest">
              <div className="absolute inset-3 border border-dashed border-outline-variant/30 pointer-events-none rounded" />

              {/* Alert Preview */}
              {preview ? (
                <div className="absolute top-1/4 -translate-y-1/2 left-4 right-4 max-w-[440px]
                  flex items-center p-3 bg-[#0e0e0e]/85 backdrop-blur-xl border-l-4 border-primary-fixed
                  shadow-[0_0_30px_rgba(200,233,236,0.15)] rounded-r"
                  style={{ animation: "slideIn 0.25s ease-out" }}>
                  {showAvatar && (
                    <div className="w-12 h-12 rounded bg-surface-container-highest border border-outline-variant mr-3 flex items-center justify-center text-lg font-bold text-on-surface-variant flex-shrink-0">
                      {preview.donor_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span className="font-bold text-primary truncate" style={{fontSize:fontSize+"px"}}>{preview.donor_name}</span>
                      <div className="flex items-center gap-1 bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/50 shrink-0">
                        <span className="material-symbols-outlined text-[11px] text-primary-fixed">diamond</span>
                        <span className="font-mono text-[11px] text-primary-fixed font-bold">{formatRp(preview.amount)}</span>
                      </div>
                    </div>
                    {preview.message && (
                      <p className="text-on-surface-variant leading-snug truncate" style={{fontSize:(fontSize-3)+"px"}}>
                        &ldquo;{preview.message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <span className="material-symbols-outlined text-[48px] text-outline block mb-2">play_circle</span>
                  <p className="text-on-surface-variant text-sm">Click <strong className="text-primary">Send Test Alert</strong> to preview</p>
                </div>
              )}

              {/* Platform badge */}
              {preview && (
                <div className="absolute bottom-4 left-4">
                  <span className={clsx("text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border bg-black/60",
                    PLAT_BADGE[preview.platform]??"text-on-surface-variant","border-current/40")}>
                    {PLATFORM_LABEL[preview.platform]??preview.platform}
                  </span>
                </div>
              )}
            </div>
          </div>

          <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}`}</style>
        </section>

        {/* Settings Panel */}
        <section className="xl:col-span-4 flex flex-col gap-4">
          {/* Browser Source */}
          <div className="bg-surface-container border border-outline-variant rounded p-4">
            <h3 className="text-sm font-semibold text-primary mb-1.5 flex items-center gap-2" style={G}>
              <span className="material-symbols-outlined text-[16px]">link</span>Browser Source
            </h3>
            <p className="text-[10px] text-on-surface-variant mb-3">Paste into OBS Browser Source (1920×1080). Do not share this URL.</p>
            <div className="flex bg-surface-container-high border border-outline-variant rounded overflow-hidden focus-within:border-primary-fixed focus-within:shadow-[0_0_8px_rgba(200,233,236,0.2)] transition-all">
              <input
                className="flex-1 bg-transparent border-none text-on-surface font-mono text-[11px] p-2 focus:ring-0 outline-none"
                readOnly
                value={overlayUrl || "Configure a license to generate URL"}
              />
              <button onClick={copyUrl} className="bg-surface-container-highest hover:bg-surface-bright border-l border-outline-variant px-3 text-primary flex items-center transition-colors">
                <span className="material-symbols-outlined text-[15px]">{copied?"check":"content_copy"}</span>
              </button>
            </div>
          </div>

          {/* Alert Tuning */}
          <div className="bg-surface-container border border-outline-variant rounded p-4 flex-1">
            <h3 className="text-sm font-semibold text-primary mb-5 flex items-center gap-2" style={G}>
              <span className="material-symbols-outlined text-[16px]">tune</span>Alert Tuning
            </h3>

            {/* Sliders */}
            <div className="space-y-5 mb-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase text-on-surface" style={G}>Display Duration</label>
                  <span className="font-mono text-[10px] text-primary-fixed">{duration}.0s</span>
                </div>
                <input type="range" min="2" max="15" value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full"/>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase text-on-surface" style={G}>Base Font Size</label>
                  <span className="font-mono text-[10px] text-primary-fixed">{fontSize}px</span>
                </div>
                <input type="range" min="12" max="28" value={fontSize} onChange={e=>setFontSize(Number(e.target.value))} className="w-full"/>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 border-t border-outline-variant pt-4 mb-6">
              {[
                { label:"Show User Avatar",    val:showAvatar, set:setAvatar },
                { label:"Enable TTS / Sound",  val:soundOn,    set:setSound  },
              ].map(({label,val,set})=>(
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-on-surface">{label}</span>
                  <button
                    onClick={()=>set(!val)}
                    className="relative w-10 h-5 rounded-full transition-colors duration-200"
                    style={{background:val?"#c8e9ec":"#2a2a2a",boxShadow:val?"0 0 8px rgba(200,233,236,0.4)":"none"}}>
                    <div className={clsx("absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 shadow-sm",val?"left-[22px]":"left-[2px]")}
                      style={{background:val?"#0e0e0e":"#ffffff"}}/>
                  </button>
                </div>
              ))}
            </div>

            {/* Test button */}
            <button
              onClick={sendTest}
              disabled={testing}
              className="w-full bg-primary text-on-primary text-[10px] font-bold uppercase py-3 rounded hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:bg-surface-bright hover:text-primary transition-all flex justify-center items-center gap-2 disabled:opacity-60"
              style={G}>
              {testing
                ? <><span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>Sending…</>
                : <><span className="material-symbols-outlined text-[15px] filled">campaign</span>Send Test Alert</>
              }
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
