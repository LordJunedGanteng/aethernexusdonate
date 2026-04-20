const BASE = process.env.NEXT_PUBLIC_API_URL!;

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export const WORKER_URL = BASE;

export const WEBHOOK_URLS: Record<string, string> = {
  saweria:    `${BASE}/webhook/saweria`,
  socialbuzz: `${BASE}/webhook/socialbuzz`,
  bagibagi:   `${BASE}/webhook/bagibagi`,
};

export const api = {
  status: () => get<{ ok: boolean; ts: number }>("/api/status"),
  donations: {
    recent: (licenseKey: string, limit = 10) =>
      get<{ donations: Donation[] }>("/api/donations/recent", {
        license_key: licenseKey,
        limit: String(limit),
      }),
    stats: (licenseKey: string) =>
      get<StatsResponse>("/api/donations/stats", { license_key: licenseKey }),
  },
  leaderboard: (licenseKey: string, timeframe: string) =>
    get<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard/${timeframe}`, {
      license_key: licenseKey,
    }),
  license: {
    validate: (licenseKey: string, gameId: string) =>
      post<LicenseValidation>("/api/license/validate", {
        license_key: licenseKey,
        game_id: gameId,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    list: (userId: number) =>
      get<{ licenses: License[] }>("/api/licenses", { user_id: String(userId) }),
    create: (body: { user_id: number; game_id: string; game_name?: string; expires_at?: string }) =>
      post<{ license_key: string }>("/api/licenses", body),
    update: (id: number, body: { status?: string; expires_at?: string }) =>
      put<{ ok: boolean }>(`/api/licenses/${id}`, body),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Donation {
  id?:          number;
  donation_id?: string;
  donor_name:   string;
  amount:       number;
  platform:     string;
  message?:     string;
  avatar_url?:  string;
  currency?:    string;
  timestamp:    string;
}

export interface LeaderboardEntry {
  rank:           number;
  donor_name:     string;
  platform:       string;
  total_amount:   number;
  donation_count: number;
}

export interface StatsResponse {
  totals: { count: number; total: number; avg: number; unique_donors: number } | null;
  by_platform: { platform: string; total: number; count: number }[];
  by_day:      { day: string; total: number; count: number }[];
}

export interface LicenseValidation {
  valid:        boolean;
  license_key?: string;
  owner?:       string;
  expires_at?:  string;
  reason?:      string;
}

export interface License {
  id:          number;
  license_key: string;
  game_id:     string;
  game_name:   string | null;
  status:      "active" | "suspended" | "expired";
  expires_at:  string | null;
  created_at:  string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatRp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function formatRpFull(n: number): string {
  return Math.floor(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const PLATFORM_COLOR: Record<string, string> = {
  saweria:    "text-primary",
  socialbuzz: "text-secondary",
  bagibagi:   "text-tertiary",
};

export const PLATFORM_LABEL: Record<string, string> = {
  saweria:    "Saweria",
  socialbuzz: "SocialBuzz",
  bagibagi:   "BagiBagi",
};
