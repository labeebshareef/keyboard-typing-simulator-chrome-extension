import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AiAvailability,
  type AiSession,
  createAiSession,
  getAiAvailability,
} from '../utils/ai';

export interface AiControls {
  /** Live availability state; re-checked on every popup open, never cached. */
  availability: AiAvailability;
  /** 0–100 while the model download is in flight, otherwise null. */
  downloadProgress: number | null;
  /**
   * Returns a ready session, creating one (and triggering the model download
   * when state is 'downloadable') on first use. MUST be called from a user
   * gesture — the Prompt API requires user activation to start a download.
   * Returns null when the API is unavailable or creation fails.
   */
  ensureSession: () => Promise<AiSession | null>;
}

export const useAi = (): AiControls => {
  const [availability, setAvailability] = useState<AiAvailability>('unavailable');
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const sessionRef = useRef<AiSession | null>(null);
  const creatingRef = useRef<Promise<AiSession | null> | null>(null);

  useEffect(() => {
    let disposed = false;
    void getAiAvailability().then((state) => {
      if (!disposed) setAvailability(state);
    });
    return () => {
      disposed = true;
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

  const ensureSession = useCallback(async (): Promise<AiSession | null> => {
    if (sessionRef.current) return sessionRef.current;
    if (creatingRef.current) return creatingRef.current;

    const creation = (async () => {
      try {
        const needsDownload = availability === 'downloadable' || availability === 'downloading';
        if (needsDownload) {
          setAvailability('downloading');
          setDownloadProgress(0);
        }
        const session = await createAiSession((percent) => setDownloadProgress(percent));
        sessionRef.current = session;
        setAvailability('available');
        setDownloadProgress(null);
        return session;
      } catch {
        setDownloadProgress(null);
        // Re-read the true state rather than guessing what failed.
        setAvailability(await getAiAvailability());
        return null;
      } finally {
        creatingRef.current = null;
      }
    })();

    creatingRef.current = creation;
    return creation;
  }, [availability]);

  return { availability, downloadProgress, ensureSession };
};
