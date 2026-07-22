import { describe, expect, it } from 'vitest';
import type { TypingSessionPhase } from '../types';
import { getTabCapabilityError, idleTypingStatus, isTypingStatusActive } from './session-status';

describe('typing session status', () => {
  it.each<TypingSessionPhase>(['validating', 'delaying', 'running', 'paused', 'stopping'])(
    'treats %s as active',
    (phase) => {
      expect(isTypingStatusActive({ ...idleTypingStatus, phase })).toBe(true);
    }
  );

  it.each<TypingSessionPhase>(['idle', 'stopped', 'completed', 'failed'])(
    'treats %s as terminal',
    (phase) => {
      expect(isTypingStatusActive({ ...idleTypingStatus, phase })).toBe(false);
    }
  );
});

describe('tab capability checks', () => {
  it('accepts normal web pages', () => {
    expect(getTabCapabilityError({ id: 1, url: 'https://example.com/form' })).toBeNull();
  });

  it.each(['chrome://settings', 'edge://settings', 'about:blank', 'chrome-extension://id/page'])(
    'rejects restricted URL %s',
    (url) => {
      expect(getTabCapabilityError({ id: 1, url })).toContain('does not allow');
    }
  );

  it('rejects missing tabs and Chrome Web Store pages with specific feedback', () => {
    expect(getTabCapabilityError(undefined)).toContain('Unable to access');
    expect(
      getTabCapabilityError({ id: 1, url: 'https://chromewebstore.google.com/detail/example' })
    ).toContain('Chrome Web Store');
  });
});
