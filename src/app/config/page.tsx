"use client";
import { useState } from "react";
import { WEBHOOK_URLS } from "@/lib/api";
import { useLicenseKey } from "@/lib/use-license";

type PlatformDef = {
  id:        string;
  name:      string;
  color:     string;
  borderCls: string;
  badgeCls:  string;
  saveCls:   string;
  ringCls:   string;
};

const PLATFORMS: PlatformDef[] = [
  {
    id: "saweria", name: "Saweria",
    color: "text-primary", borderCls: "gradient-border-saweria",
    badgeCls: "bg-primary-container/20 text-primary-fixed",
    saveCls: "from-primary to-primary-container text-on-primary shadow-[0_8px_16px_rgba(30,60,114,0.3)]",
    ringCls: "focus:ring-primary/40",
  },
  {
    id: "socialbuzz", name: "SocialBuzz",
    color: "text-secondary", borderCls: "gradient-border-socialbuzz",
    badgeCls: "bg-secondary-container/20 text-secondary-fixed",
    saveCls: "from-secondary to-secondary-container text-white shadow-[0_8px_16px_rgba(90,0,198,0.3)]",
    ringCls: "focus:ring-secondary/40",
  },
  {
    id: "bagibagi", name: "BagiBagi",
    color: "text-tertiary", borderCls: "gradient-border-bagibagi",
    badgeCls: "bg-tertiary-container/20 text-tertiary-fixed",
    saveCls: "from-tertiary to-tertiary-container text-on-tertiary-fixed shadow-[0_8px_16px_rgba(96,50,0,0.3)]",
    ringCls: "focus:ring-tertiary/40",
  },
];

function PlatformCard({ p }: { p: PlatformDef }) {
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const webhookUrl = WEBHOOK_URLS[p.id];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donation_id: "test_001", donor_name: "Test User", amount: 1000, currency: "IDR", message: "Test ping" }),
      });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  const copyWebhook = () => navigator.clipboard.writeText(webhookUrl).catch(() => {});

  return (
    <section className={`${p.borderCls} rounded-xl overflow-hidden shadow-2xl`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className={`text-xl font-bold font-headline ${p.color}`}>{p.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${enabled ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-error shadow-[0_0_8px_rgba(255,180,171,0.5)]"}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {enabled ? "System Online" : "System Offline"}
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input className="sr-only peer" type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} />
            <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container" />
          </label>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">API Key</label>
            <div className="relative">
              <input
                className={`w-full bg-surface-container-lowest rounded-lg py-3 px-4 font-mono text-sm ${p.color} focus:ring-1 ${p.ringCls} outline-none`}
                type={show ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter ${p.name} API Key`}
              />
              <button onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">{show ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Webhook URL</label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-lowest rounded-lg py-3 px-4 font-mono text-sm text-on-surface-variant truncate pr-12 outline-none"
                type="text" readOnly value={webhookUrl}
              />
              <button onClick={copyWebhook}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${p.badgeCls} p-1.5 rounded-md hover:opacity-80 transition-all active:scale-90`}>
                <span className="material-symbols-outlined text-lg">content_copy</span>
              </button>
            </div>
            <p className="text-[10px] text-outline px-1">
              Paste this URL into your {p.name} webhook settings. Incoming donations trigger real-time notifications.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex flex-col gap-3">
          {testResult && (
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg ${
              testResult === "ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-error/20 text-error"
            }`}>
              <span className="material-symbols-outlined text-sm filled">{testResult === "ok" ? "check_circle" : "error"}</span>
              {testResult === "ok" ? "Webhook reachable ✓" : "Connection failed — check worker deployment"}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleTest} disabled={testing}
              className="py-3 px-4 rounded-lg bg-surface-variant/40 border border-outline-variant/15 text-sm font-semibold hover:bg-surface-variant/60 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
              {testing && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              Test Connection
            </button>
            <button onClick={handleSave}
              className={`py-3 px-4 rounded-lg bg-gradient-to-br text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 ${p.saveCls}`}>
              {saved && <span className="material-symbols-outlined text-sm">check</span>}
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ConfigPage() {
  const { key, save, clear } = useLicenseKey();
  const [editing, setEditing] = useState(false);
  const [newKey, setNewKey] = useState(key ?? "");

  return (
    <div className="px-4 pb-12 max-w-lg mx-auto space-y-8">
      <div className="space-y-2 pt-6 px-2">
        <h2 className="text-3xl font-bold font-headline tracking-tight text-primary">Integration Vault</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Securely manage your donation stream endpoints and platform authentication keys.
        </p>
      </div>

      {/* License key management */}
      <div className="glass-panel rounded-xl p-5 border border-outline-variant/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active License Key</div>
            <code className="font-mono text-xs text-primary break-all">{key ?? "None set"}</code>
          </div>
          <button onClick={() => { setEditing(!editing); setNewKey(key ?? ""); }}
            className="p-2 rounded-lg bg-surface-variant/40 hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        {editing && (
          <div className="flex gap-2 pt-1">
            <input className="flex-1 bg-surface-container-lowest rounded-lg py-2.5 px-3 font-mono text-sm focus:ring-1 focus:ring-primary/40 outline-none"
              value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="ETH-CMD-XXXX-XXXX-XXXX" />
            <button onClick={() => { save(newKey); setEditing(false); }}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold">Save</button>
            <button onClick={() => { clear(); setEditing(false); }}
              className="px-3 py-2 rounded-lg bg-error/20 text-error text-sm font-bold">Clear</button>
          </div>
        )}
      </div>

      {PLATFORMS.map((p) => <PlatformCard key={p.id} p={p} />)}
    </div>
  );
}
