const BASE = process.env.NEXT_PUBLIC_API_URL!;

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('f4r_token');
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: getAuthHeader() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API ${path} → ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API ${path} → ${res.status}`);
  }
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API ${path} → ${res.status}`);
  }
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API ${path} → ${res.status}`);
  }
  return res.json();
}

export const WORKER_URL = BASE;


export const WEBHOOK_URLS: Record<string, string> = {
  saweria:    `${BASE}/webhook/saweria`,
  socialbuzz: `${BASE}/webhook/socialbuzz`,
  bagibagi:   `${BASE}/webhook/bagibagi`,
};

export const apiCall = async <T>(path: string, options: RequestInit): Promise<T> => {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeader(),
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API ${path} → ${res.status}`);
  }
  return res.json();
}

export const api = {
  status: () => get<{ ok: boolean; ts: number }>("/api/status"),

  platform: {
    generateSecret: (platform: string) =>
      post<{ ok: boolean, webhook_secret: string, webhook_url: string }>("/api/platform/generate-secret", { platform }),

    saveApiKey: (platform: string, apiKey: string) =>
      post<{ ok: boolean }>("/api/platform/save-apikey", { platform, api_key: apiKey }),

    getConfigs: () =>
      get<{ configs: PlatformConfig[] }>("/api/platform/configs"),

    toggle: (platform: string, isActive: boolean) =>
      post<{ ok: boolean }>("/api/platform/toggle", { platform, is_active: isActive }),

    health: () =>
      get<{ health: PlatformHealth[]; checked_at: string }>("/api/platform/health"),
  },

  donations: {
    recent: (licenseKey: string, limit = 10) =>
      get<{ donations: Donation[] }>("/api/donations/recent", {
        license_key: licenseKey,
        limit: String(limit),
      }),
    stats: (licenseKey: string) =>
      get<StatsResponse>("/api/donations/stats", { license_key: licenseKey }),
    inject: (platform: string, donor_name: string, amount: number, currency = "IDR", message?: string) =>
      post<{ ok: boolean; donation_id: string }>("/api/donations/inject", {
        platform, donor_name, amount, currency, message,
      }),
  },

  webhook: {
    logs: (platform?: string, limit = 50, offset = 0) =>
      get<{ logs: WebhookLog[]; total: number }>("/api/webhook/logs", {
        ...(platform ? { platform } : {}),
        limit: String(limit),
        offset: String(offset),
      }),
  },

  leaderboard: (licenseKey: string, timeframe: string) =>
    get<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard/${timeframe}`, {
      license_key: licenseKey,
    }),

  admin: {
    listUsers: () =>
      get<{ users: AdminUser[] }>("/api/admin/users"),
    deleteUser: (id: number) =>
      del<{ ok: boolean }>(`/api/admin/users/${id}`),
    updateRole: (id: number, role: string) =>
      put<{ ok: boolean }>(`/api/admin/users/${id}/role`, { role }),
    generateKey: (username: string, password: string, role: string, licensed_to?: string, universe_id?: string) =>
      post<{ ok: boolean; license_key: string; username: string; user_id: number }>(
        "/api/admin/generate-key",
        { username, password, role, licensed_to, universe_ids: universe_id ? [universe_id] : [] },
      ),
    getLogs: () =>
      get<any>("/api/admin/logs"),
    // Legacy alias
    users: () => get<{ users: AdminUser[] }>("/api/admin/users"),
  },

  licenses: {
    list: () => get<{ licenses: License[] }>("/api/licenses"),
    create: (body: { game_id: string; game_name?: string; expires_at?: string }) =>
      post<{ license_key: string }>("/api/licenses", body),
    update: (id: number, body: { status?: string; expires_at?: string; game_name?: string; universe_ids?: string[] }) =>
      put<{ ok: boolean }>(`/api/licenses/${id}`, body),
  },

  // Legacy alias kept for backwards compat
  license: {
    validate: (licenseKey: string, gameId: string) =>
      post<LicenseValidation>("/api/license/validate", {
        license_key: licenseKey,
        game_id: gameId,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    list: () => get<{ licenses: License[] }>("/api/licenses"),
    create: (body: { game_id: string; game_name?: string; expires_at?: string }) =>
      post<{ license_key: string }>("/api/licenses", body),
    update: (id: number, body: { status?: string; expires_at?: string; game_name?: string; universe_ids?: string[] }) =>
      put<{ ok: boolean }>(`/api/licenses/${id}`, body),
  },

  roblox: {
    game: (licenseKey: string) =>
      get<RobloxGameInfo>("/api/roblox/game", { license_key: licenseKey }),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;
  username: string;
  role: string;
  created_at: string;
  license_id: number | null;
  license_key: string | null;
  status: string | null;
  universe_ids: string[];
  platform_api_keys: Record<string, string>;
}
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
  rank:             number;
  donor_name:       string;
  platform:         string;
  total_amount:     number;
  donation_count:   number;
  last_donation_at?: string;
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

export interface PlatformConfig {
  platform:         string;
  has_api_key:      boolean;
  webhook_secret:   string | null;
  webhook_url:      string | null;
  is_active:        boolean;
  last_verified_at: string | null;
  platform_api_key?: string;
}

export interface License {
  id:           number;
  license_key:  string;
  game_id:      string;
  game_name:    string | null;
  status:       "active" | "suspended" | "expired";
  expires_at:   string | null;
  created_at:   string;
  universe_ids?: string;
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
  trakteer:   "text-error",
  twitch:     "text-purple-400",
};

export const PLATFORM_LABEL: Record<string, string> = {
  saweria:    "Saweria",
  socialbuzz: "SocialBuzz",
  bagibagi:   "BagiBagi",
  trakteer:   "Trakteer",
  twitch:     "Twitch",
};

export interface PlatformHealth {
  platform:         string;
  is_active:        boolean;
  has_secret:       boolean;
  last_received:    string | null;
  donations_today:  number;
  donations_total:  number;
  status:           "online" | "disabled" | "not_configured";
}

export interface WebhookLog {
  id:             number;
  platform:       string;
  payload:        string;
  payload_parsed: unknown;
  status:         number;
  created_at:     string;
}

export interface RobloxGameInfo {
  universeId:   number;
  name:         string;
  description:  string;
  creator:      string;
  playing:      number;
  visits:       number;
  maxPlayers:   number;
  thumbnailUrl: string | null;
}
