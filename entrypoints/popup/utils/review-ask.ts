/**
 * One-time, low-pressure review ask: shown after the 3rd successfully
 * completed typing session, dismissible forever. No nagging, no repeat asks,
 * nothing shown on failures.
 */

const STORAGE_KEY = 'reviewAsk';
const SESSIONS_BEFORE_ASK = 3;

export const REVIEW_URL =
  'https://chromewebstore.google.com/detail/flieihjecdghlbgbmjbilfcabbdplanh/reviews';

interface ReviewAskState {
  completedSessions: number;
  dismissed: boolean;
}

const readState = async (): Promise<ReviewAskState> => {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const value = stored[STORAGE_KEY];
    if (typeof value === 'object' && value !== null) {
      const record = value as Record<string, unknown>;
      return {
        completedSessions:
          typeof record.completedSessions === 'number' && Number.isFinite(record.completedSessions)
            ? Math.max(0, Math.floor(record.completedSessions))
            : 0,
        dismissed: record.dismissed === true,
      };
    }
  } catch {
    // fall through
  }
  return { completedSessions: 0, dismissed: false };
};

/**
 * Record one completed session. Returns true when the review card should be
 * shown (threshold reached and never dismissed).
 */
export async function recordCompletedSession(): Promise<boolean> {
  const state = await readState();
  const next: ReviewAskState = {
    completedSessions: state.completedSessions + 1,
    dismissed: state.dismissed,
  };
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: next });
  } catch {
    return false;
  }
  return !next.dismissed && next.completedSessions >= SESSIONS_BEFORE_ASK;
}

/** Permanently dismiss the ask (also called after the user opens the review page). */
export async function dismissReviewAsk(): Promise<void> {
  const state = await readState();
  try {
    await chrome.storage.local.set({
      [STORAGE_KEY]: { ...state, dismissed: true },
    });
  } catch {
    // non-fatal
  }
}
