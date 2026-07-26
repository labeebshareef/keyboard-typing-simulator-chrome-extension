/**
 * Remote compatibility gate.
 *
 * The extension periodically fetches a tiny static JSON file (no backend —
 * a raw file in a public GitHub repo, free and CDN-cached) and compares its
 * `minVersion` against the installed version. When the installed version is
 * older, the popup swaps to an "update required" screen and the keyboard
 * commands refuse to run until Chrome applies the pending update.
 *
 * Design rules:
 * - Fail-open: if the config was never fetched or the fetch fails, the
 *   extension works normally. Once a config IS cached it keeps applying
 *   offline, so going offline never unblocks an outdated version.
 * - Data only, never code: the config carries a version string and plain
 *   text. Nothing from it is executed (Chrome Web Store remote-code policy).
 * - Zero new permissions: raw.githubusercontent.com serves
 *   `Access-Control-Allow-Origin: *`, so a plain fetch works from the popup
 *   and the service worker without host permissions.
 */

// Served from the public `typereel-config` repo (see
// docs/update-system-setup.md). If this URL ever 404s, the gate silently
// stays open — safe either way.
export const REMOTE_CONFIG_URL =
  'https://raw.githubusercontent.com/labeebshareef/typereel-config/main/config.json';

/** Chrome Web Store listing — fallback target for the Update button. */
export const STORE_URL =
  'https://chromewebstore.google.com/detail/flieihjecdghlbgbmjbilfcabbdplanh';

const STORAGE_KEY = 'versionGate';
/** Re-fetch at most every 6 hours; the file rarely changes. */
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const MAX_MESSAGE_LENGTH = 300;

export interface RemoteConfig {
  minVersion: string;
  message?: string;
  updateUrl?: string;
}

interface GateCache {
  config: RemoteConfig;
  fetchedAt: number;
}

export interface GateStatus {
  blocked: boolean;
  message: string;
  updateUrl: string;
}

const DEFAULT_MESSAGE =
  'This version of TypeReel is out of date and no longer supported. ' +
  'Update to the latest version to keep typing — it only takes a moment.';

const VERSION_PATTERN = /^\d+(\.\d+){0,3}$/;

/**
 * Compare two dotted version strings numerically.
 * Returns <0 when a is older than b, 0 when equal, >0 when newer.
 */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const right = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Validate an untrusted parsed config. Returns null when the payload is not
 * usable; the caller then keeps the previous cache (never fail closed on a
 * malformed file). The updateUrl is restricted to the Chrome Web Store so a
 * compromised config file can never send users to an arbitrary site.
 */
export function parseRemoteConfig(value: unknown): RemoteConfig | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.minVersion !== 'string' || !VERSION_PATTERN.test(record.minVersion)) {
    return null;
  }
  const config: RemoteConfig = { minVersion: record.minVersion };
  if (typeof record.message === 'string' && record.message.trim()) {
    config.message = record.message.trim().slice(0, MAX_MESSAGE_LENGTH);
  }
  if (
    typeof record.updateUrl === 'string' &&
    /^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com)\//.test(record.updateUrl)
  ) {
    config.updateUrl = record.updateUrl;
  }
  return config;
}

function getInstalledVersion(): string {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return '0.0.0';
  }
}

async function readCache(): Promise<GateCache | null> {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const value = stored[STORAGE_KEY];
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    const config = parseRemoteConfig(record.config);
    if (!config) return null;
    return {
      config,
      fetchedAt: typeof record.fetchedAt === 'number' ? record.fetchedAt : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the remote config if the cached copy is stale. Throttled, silent and
 * non-blocking by design — callers fire it with `void` and read the cache.
 */
export async function refreshRemoteConfig(force = false): Promise<void> {
  if (REMOTE_CONFIG_URL.includes('<')) return; // placeholder URL, not set up yet
  const cache = await readCache();
  if (!force && cache && Date.now() - cache.fetchedAt < REFRESH_INTERVAL_MS) return;

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(REMOTE_CONFIG_URL, {
      signal: abort.signal,
      cache: 'no-cache',
    });
    if (!response.ok) return; // 404 (repo not created yet) etc. → fail open
    const config = parseRemoteConfig(await response.json());
    if (!config) return;
    await chrome.storage.local.set({
      [STORAGE_KEY]: { config, fetchedAt: Date.now() } satisfies GateCache,
    });
  } catch {
    // Offline or blocked — keep whatever is cached.
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gate decision from the cached config only — instant, no network. Use in hot
 * paths (keyboard commands). `installedVersion` is injectable for tests.
 */
export async function getGateStatus(installedVersion?: string): Promise<GateStatus> {
  const version = installedVersion ?? getInstalledVersion();
  const cache = await readCache();
  const config = cache?.config;
  return {
    blocked: config ? compareVersions(version, config.minVersion) < 0 : false,
    message: config?.message ?? DEFAULT_MESSAGE,
    updateUrl: config?.updateUrl ?? STORE_URL,
  };
}

/**
 * Popup entry point: refresh (throttled) and return the current decision.
 * The fetch happens before the decision so a newly raised minVersion takes
 * effect on the very next popup open, not one open later.
 */
export async function checkVersionGate(): Promise<GateStatus> {
  await refreshRemoteConfig();
  return getGateStatus();
}
