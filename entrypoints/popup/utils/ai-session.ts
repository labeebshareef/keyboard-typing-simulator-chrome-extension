/**
 * Shared, non-React AI session holder used by the background service worker
 * (the popup keeps its own React `useAi` hook). One cached session serves
 * every tab's field assistant.
 *
 * The worker has no user activation, so it can only *use* a model that is
 * already downloaded — it never triggers the download. That stays a popup
 * flow (see the plan: "model download consent stays popup-only").
 */
import { type AiSession, createAiSession, getAiAvailability } from './ai';

let cached: AiSession | null = null;
let creating: Promise<AiSession | null> | null = null;

/**
 * Returns a ready session, or null when the model is not `available`
 * (unavailable, or downloadable/downloading — both require the popup to
 * complete the download first).
 */
export async function getSharedSession(): Promise<AiSession | null> {
  if (cached) return cached;
  if (creating) return creating;

  creating = (async () => {
    try {
      if ((await getAiAvailability()) !== 'available') return null;
      cached = await createAiSession();
      return cached;
    } catch {
      cached = null;
      return null;
    } finally {
      creating = null;
    }
  })();

  return creating;
}

export function clearSharedSession(): void {
  cached?.destroy?.();
  cached = null;
}
