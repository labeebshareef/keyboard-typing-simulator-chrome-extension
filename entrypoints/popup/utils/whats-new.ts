/**
 * "What's new" release notes.
 *
 * The background worker records update events (chrome.runtime.onInstalled),
 * and the popup shows a one-time paged changelog covering every version
 * between the one the user updated from and the one now installed. Fresh
 * installs never see it — release notes are only meaningful to people who
 * had the previous behavior.
 */
import { compareVersions } from './version-gate';

const STORAGE_KEY = 'whatsNew';

export interface ChangelogEntry {
  version: string;
  title: string;
  points: string[];
}

/** Newest first. Add a new entry at the top for every release. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.3.0',
    title: 'Field assistant & smoother updates',
    points: [
      'New field assistant: press Alt+Shift+A on any page to show AI icons next to input fields — write or rewrite text right where you need it.',
      'AI presets now adapt to the site you are on.',
      'Update notes like this one appear after each new version, so you always know what changed.',
      'Faster, more reliable updates behind the scenes.',
    ],
  },
  {
    version: '3.2.0',
    title: 'Export your typing as video or GIF',
    points: [
      'Turn any script into a shareable WebM video or GIF — three themes, three sizes, straight from the clapperboard button.',
      'New clipboard shortcut (Alt+Shift+C): types whatever is on your clipboard into the focused field. Off by default — enable it in the gear menu.',
    ],
  },
  {
    version: '3.1.0',
    title: 'On-device AI assist',
    points: [
      "Generate or rewrite text with Chrome's built-in AI — everything runs locally on your machine.",
      'Auto-fill detected fields with sensible sample data in one click.',
    ],
  },
  {
    version: '3.0.0',
    title: 'TypeReel — a fresh start',
    points: [
      'Keyboard Typing Simulator is now TypeReel, with a cleaner look.',
      'Keyboard shortcuts: Alt+Shift+T types your saved text, Alt+Shift+P pauses or resumes.',
    ],
  },
];

interface WhatsNewState {
  lastSeenVersion: string;
  /** Set while an update notice is waiting to be shown. */
  pendingFrom?: string;
}

function getInstalledVersion(): string {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return '0.0.0';
  }
}

async function readState(): Promise<WhatsNewState | null> {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const value = stored[STORAGE_KEY];
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.lastSeenVersion !== 'string') return null;
    return {
      lastSeenVersion: record.lastSeenVersion,
      pendingFrom: typeof record.pendingFrom === 'string' ? record.pendingFrom : undefined,
    };
  } catch {
    return null;
  }
}

async function writeState(state: WhatsNewState): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  } catch {
    // non-fatal — worst case the notice shows again next time
  }
}

/**
 * Entries newer than `previousVersion` and no newer than `installedVersion`,
 * newest first — exactly the releases the user just received.
 */
export function entriesSince(previousVersion: string, installedVersion: string): ChangelogEntry[] {
  return CHANGELOG.filter(
    (entry) =>
      compareVersions(entry.version, previousVersion) > 0 &&
      compareVersions(entry.version, installedVersion) <= 0
  );
}

/**
 * Background: record install/update events. On update, remember the version
 * the user came from so the popup can show everything in between.
 */
export async function recordInstallEvent(reason: string, previousVersion?: string): Promise<void> {
  const current = getInstalledVersion();
  if (reason === 'install') {
    await writeState({ lastSeenVersion: current });
    return;
  }
  if (reason === 'update' && previousVersion && compareVersions(previousVersion, current) < 0) {
    await writeState({ lastSeenVersion: previousVersion, pendingFrom: previousVersion });
  }
}

/**
 * Popup: the entries to show now, or null when nothing is pending.
 * A missing state (e.g. dev reload where onInstalled fired before this code
 * existed) is initialized silently rather than shown as an update.
 */
export async function getPendingWhatsNew(): Promise<ChangelogEntry[] | null> {
  const current = getInstalledVersion();
  const state = await readState();
  if (!state) {
    await writeState({ lastSeenVersion: current });
    return null;
  }
  if (!state.pendingFrom) return null;
  const entries = entriesSince(state.pendingFrom, current);
  if (entries.length === 0) {
    await writeState({ lastSeenVersion: current });
    return null;
  }
  return entries;
}

/** Popup: mark the current version's notes as seen. */
export async function markWhatsNewSeen(): Promise<void> {
  await writeState({ lastSeenVersion: getInstalledVersion() });
}
