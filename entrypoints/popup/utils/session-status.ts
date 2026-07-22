import type { TypingSessionPhase, TypingSessionStatus } from '../types';

export const idleTypingStatus: TypingSessionStatus = {
  sessionId: null,
  mode: null,
  phase: 'idle',
  progress: 0,
  currentFieldIndex: 0,
  totalFields: 0,
  completedFields: 0,
  failedFields: 0,
  message: '',
};

const activePhases = new Set<TypingSessionPhase>([
  'validating',
  'delaying',
  'running',
  'paused',
  'stopping',
]);

export const isTypingStatusActive = (status: TypingSessionStatus): boolean =>
  activePhases.has(status.phase);

export const getTabCapabilityError = (
  tab: { id?: number; url?: string } | undefined
): string | null => {
  if (!tab?.id) return 'Unable to access the current tab.';
  const url = tab.url ?? '';
  if (/^(chrome|edge|about|chrome-extension|moz-extension):/.test(url)) {
    return 'This browser page does not allow extension typing. Open a regular website.';
  }
  if (url.startsWith('https://chromewebstore.google.com/')) {
    return 'Chrome Web Store pages do not allow extension typing.';
  }
  return null;
};
