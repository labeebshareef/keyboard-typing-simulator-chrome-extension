/**
 * "Last script" storage for the keyboard shortcut.
 *
 * Privacy contract (matches the listing's "typed text is not persisted"):
 * - Default: chrome.storage.session only — memory-backed, cleared when the
 *   browser closes, never written to disk.
 * - Opt-in ("Remember text after restart"): mirrored to chrome.storage.local.
 *
 * The popup calls `saveLastScript` after a successful basic-mode start; the
 * background worker calls `loadLastScript` when the typing shortcut fires.
 */

const KEY = 'lastScript';
const MAX_LENGTH = 50_000;

export async function saveLastScript(text: string, persistToDisk: boolean): Promise<void> {
  const value = text.slice(0, MAX_LENGTH);
  try {
    await chrome.storage.session.set({ [KEY]: value });
  } catch {
    // session storage unavailable — non-fatal
  }
  try {
    if (persistToDisk) {
      await chrome.storage.local.set({ [KEY]: value });
    } else {
      await chrome.storage.local.remove(KEY);
    }
  } catch {
    // non-fatal
  }
}

/** Session copy wins (fresher); the local copy is the opt-in fallback. */
export async function loadLastScript(): Promise<string | null> {
  try {
    const session = await chrome.storage.session.get(KEY);
    const value = session[KEY];
    if (typeof value === 'string' && value.length > 0) return value;
  } catch {
    // fall through to local
  }
  try {
    const local = await chrome.storage.local.get(KEY);
    const value = local[KEY];
    if (typeof value === 'string' && value.length > 0) return value;
  } catch {
    // fall through
  }
  return null;
}

export async function clearLastScript(): Promise<void> {
  await Promise.allSettled([chrome.storage.session.remove(KEY), chrome.storage.local.remove(KEY)]);
}
