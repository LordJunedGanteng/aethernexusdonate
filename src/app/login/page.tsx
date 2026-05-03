'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, setLicenseKey } from '@/lib/auth';
import { apiCall } from '@/lib/api';

const G = { fontFamily: "var(--font-space-grotesk,'Space Grotesk'),sans-serif" };

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiCall<{ token: string; role: 'admin' | 'user'; user_id: number }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      setToken(res.token);

      if (res.role === 'user') {
        try {
          const licRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/licenses`);
          const licData = await licRes.json();
          const activeLic = licData.licenses?.find((l: any) => l.status === 'active');
          if (activeLic) setLicenseKey(activeLic.license_key);
        } catch { /* ignore */ }
      }

      router.push(res.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex items-center justify-center p-4">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary-fixed/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface-container border border-surface-container-high rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header strip */}
          <div className="bg-surface-container-high border-b border-surface-container-highest px-6 py-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-fixed text-[20px]">terminal</span>
            <div>
              <h1 className="text-sm font-bold text-primary tracking-widest uppercase" style={G}>
                Aether Nexus
              </h1>
              <p className="text-[10px] text-on-surface-variant font-mono">F4R Services — Access Control</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* System status */}
            <div className="flex items-center gap-2 bg-surface-container-highest border border-surface-container-high rounded px-3 py-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute h-full w-full rounded-full bg-primary-fixed opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-primary-fixed" />
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant">
                SYSTEM ONLINE — Awaiting credentials
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-error/10 border border-error/30 text-error px-3 py-2.5 rounded text-sm">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span className="font-mono text-[11px]">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block" style={G}>
                  Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[16px]">person</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                    autoComplete="username"
                    className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary-fixed focus:shadow-[0_0_8px_rgba(200,233,236,0.15)] transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block" style={G}>
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[16px]">lock</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    className="w-full bg-surface-container-high border border-outline-variant rounded pl-9 pr-10 py-2.5 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary-fixed focus:shadow-[0_0_8px_rgba(200,233,236,0.15)] transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-primary text-on-primary text-[10px] font-bold uppercase py-3 rounded hover:bg-primary-fixed hover:shadow-[0_0_20px_rgba(200,233,236,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                style={G}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                    Authenticating…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">login</span>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-outline font-mono pt-1">
              F4R Services © 2025 — Authorized access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
